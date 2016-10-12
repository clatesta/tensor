from flask import g, session, json
from app import BASE_PATH, USP_LICENSE, db
from urllib.parse import urljoin, urlparse
from itertools import chain
from itertools import zip_longest
from nested_lookup import nested_lookup
import datetime as dt
import dateutil
import m3u8
import xmltodict
import re
import time
import requests


def serialize_sqla(data, serialize_date=True):
    """
    Serialiation function to serialize any dicts or lists containing sqlalchemy
    objects. This is needed for conversion to JSON format.
    """
    # TODO: support defaultdicts!!!!!

    # If has to_dict this is asumed working and it is used
    if hasattr(data, 'to_dict'):
        return data.to_dict(serialize_date=serialize_date)

    # DateTime objects should be returned as isoformat
    if hasattr(data, 'isoformat') and serialize_date:
        return str(data.isoformat())

    # TimeDelta objects should be returned as the number of seconds they
    # represent.
    if hasattr(data, 'total_seconds') and serialize_date:
        return data.total_seconds()

    if isinstance(data, Decimal):
        if data % 1 == 0:  # No decimal values
            return int(data)
        return float(data)

    # Dictionaries get iterated over
    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            # TODO: Add support for non string keys (autoconversion)
            result[key] = serialize_sqla(value, serialize_date=serialize_date)

        return result

    # Iterables that are not strings are looped over and every value is
    # serialized
    if not isinstance(data, str) and hasattr(data, '__iter__'):
        return [serialize_sqla(item, serialize_date=serialize_date) for item in
                data]

    # Try using the built in __dict__ functions and serialize that seperately
    if hasattr(data, '__dict__'):
        return serialize_sqla(data.__dict__, serialize_date=serialize_date)

    # Just hope it works
    return data


def set_server_session():
    from app.models import Session
    server_session = None
    if('uuid' not in session):
        server_session = Session.new_session()
        session['uuid'] = server_session.uuid
    else:
        server_session = Session.by_uuid(session['uuid'])
        if(server_session is None):
            server_session = Session.new_session()
            session['uuid'] = server_session.uuid
    db.session.commit()
    g.server_session = server_session


def build_wrk_cmd(host, threads=1, connections=1, duration=5, timeout=5,
                  close=True, script='get.lua'):
    wrk_cmd = (BASE_PATH + 'wrk/wrk ' +
                           '--threads ' + str(threads) + ' ' +
                           '--connections ' + str(connections) + ' ' +
                           '--duration ' + str(duration) + 's ' +
                           '--timeout ' + str(timeout) + 's ' +
                           ('--header "Connection: Close" ' if close else '') +
                           '--script ' + BASE_PATH + 'wrk/scripts/' + script +
                           ' ' + host)
    return wrk_cmd


def build_capture_cmd(host, bitrate_filter=''):
    capture_cmd = ('unified_capture ' +
                   '--license-key=' + USP_LICENSE + ' ' +
                   '--dry_run ' +
                   '-o /dev/null ' +
                   host + bitrate_filter)
    return capture_cmd


def build_wrk_requests(segmentlist, method='GET'):
    requests = []
    for url in segmentlist:
        parsed_url = urlparse(url)
        requests.append(method + " " + parsed_url.path + " HTTP/1.1\r\n" +
                        "Host: " + parsed_url.netloc + "\r\n" +
                        "Connection: Close\r\n\r\n")
    return requests


def parse_wrk_response(output, return_format='JSON'):
    summary = re.search(r'summary:.({.*})', str(output))
    result = {}

    if(summary):
        result = json.loads(summary.group(1))
        result['timestamp'] = time.time()
        if return_format is 'ASCII':
            result = (str(result['timestamp']) + ', ' +
                      str(result['bytes_sec']) + ', ' +
                      str(result['requests_sec']) + ', ' +
                      str(result['errors_sec']) + ', ' +
                      str(result['latency']['min']) + ', ' +
                      str(result['latency']['mean']) + ', ' +
                      str(result['latency']['max']) + ', ' +
                      str(result['latency']['stdev']))
    else:
        print('WRK output: %s\nFailed to produce regex-passing results',
              output.decode('utf8'))
        result = {'error': 'WRK failed', 'output': str(output)}
        if return_format is 'ASCII':
            result = (result['timestamp'] + ', ' + 0 + ', ' + 0 + ', ' + 0 +
                      ', ' + 0 + ', ' + 0 + ', ' + 0 + ', ' + 0)
    return result


def parse_m3u8(host):
    response = m3u8.load(host)
    if(not response.is_variant):
        return None

    media_segments = []
    media_bandwidths = []
    for playlist in response.playlists:
        media_bandwidths.append(playlist.stream_info.bandwidth)
        media_url = urljoin(host, playlist.uri)
        media_response = m3u8.load(media_url)
        media_segments.append([urljoin(host, s.uri)
                               for s in media_response.segments])

    return {'segments': list(chain.from_iterable(
        filter(lambda p: p, pair) for pair in zip_longest(
            *media_segments))),
            'bitrates': sorted(map(lambda x: int(x), media_bandwidths))}


def parse_mpd(host):
    r = requests.get(host)
    if r.status_code != 200:
        raise Exception('Host didn\'t return status code 200')
    xml_data = r.text
    data = xmltodict.parse(xml_data, attr_prefix='',
                           force_list={'Period': True, 'AdaptationSet': True,
                                       'Representation': True,
                                       'S': True})['MPD']
    # print(json.dumps(data, indent=2))
    # mpd = MPD(data, host)
    # print(mpd.segments)
    segments = []
    bitrates = sorted(map(lambda x: int(x), nested_lookup('bandwidth', data)))
    return {'segments': segments,
            'bitrates': bitrates}


def parse_manifest(host):
    r = requests.get(host)
    if r.status_code != 200:
        raise Exception('Host didn\'t return status code 200')
    xml_data = r.text
    data = xmltodict.parse(xml_data, attr_prefix='',
                           force_list={})
    # print(json.dumps(data, indent=2))

    segments = []
    bitrates = sorted(map(lambda x: int(x), nested_lookup('Bitrate', data)))
    return {'segments': segments,
            'bitrates': bitrates}


def parse_f4m(host):
    r = requests.get(host)
    if r.status_code != 200:
        raise Exception('Host didn\'t return status code 200')
    xml_data = r.text
    data = xmltodict.parse(xml_data, attr_prefix='',
                           force_list={})
    # print(json.dumps(data, indent=2))

    segments = []
    return {'segments': segments,
            'bitrates': sorted(map(lambda x: int(x) * 1000,
                                   nested_lookup('bitrate', data)))}


def parse_adap(period, segments, url):
    segments_clean = True
    adap_list = []
    for adap in period['AdaptationSet']:
        new_adap = {}
        new_adap['url'] = parse_mpd_baseurl(adap, url)

        new_segments = parse_segments(adap, new_adap['url'],
                                      period['duration'])
        if('Representation' in adap):
            new_adap['Representation'], new_segments = parse_rep(
                period, adap, new_segments, new_adap['url'])
        if(new_segments):
            if(segments_clean):
                segments_clean = False
                segments = []
            segments.append(new_segments)

        adap_list.append(new_adap)
    return adap_list, segments


def parse_rep(period, adap, segments, url):
    segments_clean = True
    rep_list = []
    for rep in adap['Representation']:
        new_rep = {}
        new_rep['url'] = parse_mpd_baseurl(rep, url)
        new_rep = merge_dicts(new_rep, rep)

        new_segments = parse_segments(rep, new_rep['url'], period['duration'])
        if(new_segments):
            if(segments_clean):
                segments_clean = False
                segments = []
            segments.append(new_segments)

        rep_list.append(new_rep)
    return rep_list, segments


def parse_segments(mpd):
    if 'SegmentTemplate' in mpd.data:
        return parse_segment_template(mpd)
    elif 'SegmentList' in mpd.data:
        return parse_segmentlist(mpd)
    elif 'SegmentBase' in mpd.data:
        return mpd.url + mpd.data['SegmentBase']
    else:
        return []


def parse_segmentlist(segmentlist):
    segments = []
    for entry in segment_list:
        print(entry)
    return segments


def parse_segment_template(mpd):
    format_pat = r'(\%(\d+[dxXo]))'
    segments = []
    template = mpd.data['SegmentTemplate']
    media = template['media']

    time_format = re.search(r'\$Time' + format_pat + r'\$', media)
    if(time_format):
        media = media.replace(time_format.group(1), '')
        time_format = '{0:' + time_format.group(2) + '}'
    else:
        time_format = '{0:d}'

    number_format = re.search(r'\$Number' + format_pat + r'\$', media)
    if(number_format):
        media = media.replace(number_format.group(1), '')
        number_format = '{0:' + number_format.group(2) + '}'
    else:
        number_format = '{0:d}'

    if('Representation' in mpd.data):
        reps = mpd.data['Representation']
    else:
        reps = [mpd.data]

    if('SegmentTimeline' in template):
        timeline = template['SegmentTimeline']
        for rep in reps:
            new_segments = []
            base = mpd.url + media.replace('$RepresentationID$', rep['id'])

            t_index = 0
            i_index = 0
            for s in timeline['S']:
                d = int(s['d'])
                if('t' in s):
                    t_index = int(s['t'])
                r = int(s['r']) + 1 if 'r' in s else 1
                for i in range(0, r):
                    segment_url = (
                        base
                        .replace('$Time$', time_format.format(t_index))
                        .replace('$Number$', number_format.format(i_index))
                    )
                    new_segments.append(segment_url)

                    t_index += d
                    i_index += 1
            segments.append(new_segments)

    elif('duration' in template):
        for rep in reps:
            new_segments = []
            # base = url + media.replace('$RepresentationID$', rep['id'])

            # segment_time = dt.timedelta()
            # while(segment_time < template['duration']):

            # i_index = 0
            # print(base)
            segments.append(new_segments)

    return segments


def parse_mpd_baseurl(mpd_dict):
    if 'BaseURL' in mpd_dict:
        baseurl = mpd_dict['BaseURL']
        if isinstance(baseurl, dict):
            return baseurl['#text']
        elif isinstance(baseurl, str):
            return baseurl
        else:
            return ''
    else:
        return ''


def parse_mpd_duration(mpd_dict, keys):
    duration_regex = re.compile(r'^([-])?P(?:([\d.]*)Y)?(?:([\d.]*)M)?' +
                                r'(?:([\d.]*)D)?T?(?:([\d.]*)H)?' +
                                r'(?:([\d.]*)M)?(?:([\d.]*)S)?')
    return_keys = {}
    for key in keys:
        if key not in mpd_dict:
            continue
        m = re.search(duration_regex, mpd_dict[key])
        if(not m):
            continue

        milliseconds = 0
        sign, years, months, days, hours, minutes, seconds = m.groups(0)
        spl_sec = seconds.split('.')
        if(len(spl_sec) > 1):
            milliseconds = int(float('0.' + spl_sec[1]) * 1000)
            seconds = int(spl_sec[0])
        return_keys[key] = dt.timedelta(milliseconds=milliseconds,
                                        seconds=int(seconds),
                                        minutes=int(minutes),
                                        hours=int(hours),
                                        days=(int(days) + (int(months) * 30) +
                                              (int(years) * 365)))
    return return_keys


def merge_dicts(x, y):
    '''Given two dicts, merge them into a new dict as a shallow copy.'''
    z = x.copy()
    z.update(y)
    return z


class MPDBase(object):
    prints = ()

    def __repr__(self):
        string = '<%s(' % (type(self).__name__)

        for i, attr in enumerate(self.prints):
            if i:
                string += ', '
            string += '"%s"' % (getattr(self, attr))

        string += ')>'
        return string


class Representation(MPDBase):
    prints = ('segments', )
    segments = []

    def __init__(self, parent, data):
        self.parent = parent
        self.data = data

        baseurl = parse_mpd_baseurl(data)
        if(baseurl != ''):
            setattr(self, 'BaseURL', baseurl)
            setattr(self, 'url', self.parent.url + baseurl)
        else:
            setattr(self, 'url', self.parent.url)

        self.segments = parse_segments(self)

        if(self.segments):
            self.parent.segments.extend(segments)


class AdaptationSet(MPDBase):
    prints = ('url', 'Representations')
    Representations = []
    segments = []

    def __init__(self, parent, data):
        self.parent = parent
        self.data = data

        baseurl = parse_mpd_baseurl(data)
        if(baseurl != ''):
            setattr(self, 'BaseURL', baseurl)
            setattr(self, 'url', parent.url + baseurl)
        else:
            setattr(self, 'url', parent.url)

        self.segments = parse_segments(self)

        if('Representation' in data):
            for representation in data['Representation']:
                self.Representations.append(Representation(self,
                                            representation))

        if(self.segments):
            self.parent.segments.extend(segments)


class Period(MPDBase):
    prints = ('AdaptationSets', )
    AdaptationSets = []
    segments = []

    def __init__(self, parent, data):
        self.parent = parent
        self.data = data

        baseurl = parse_mpd_baseurl(data)
        if(baseurl != ''):
            setattr(self, 'BaseURL', baseurl)
            setattr(self, 'url', parent.url + baseurl)
        else:
            setattr(self, 'url', parent.url)

        self.segments = parse_segments(self)

        if('AdaptationSet' in data):
            for adap_set in data['AdaptationSet']:
                self.AdaptationSets.append(AdaptationSet(self, adap_set))

        if(self.segments):
            self.parent.segments.extend(segments)

    def get_duration(self):
        if(hasattr(self, 'duration')):
            return self.duration
        else:
            return parent.get_duration()


class MPD(MPDBase):
    prints = ('url', 'Periods', 'segments')
    dur_keys = ["maxSegmentDuration", "mediaPresentationDuration",
                "minBufferTime"]
    Periods = []
    segments = []

    def __init__(self, data, host):
        baseurl = parse_mpd_baseurl(data)
        if(baseurl != ''):
            setattr(self, 'BaseURL', baseurl)
            setattr(self, 'url', baseurl)
        else:
            setattr(self, 'url',
                    urljoin(host, 'temp.temp').replace('temp.temp', ''))

        for key, val in parse_mpd_duration(data, self.dur_keys).items():
            setattr(self, key, val)

        for period in data['Period']:
            self.Periods.append(Period(self, period))

    def get_duration(self):
        print('bla')
