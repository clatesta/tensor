"""local.py - API for things bench client has to test."""
from flask import Blueprint, jsonify, request, json, g
from app import USP_LICENSE
from app.system.utils import set_server_session, build_wrk_cmd, \
    parse_wrk_response, build_capture_cmd, build_wrk_requests, parse_m3u8, \
    parse_mpd, parse_manifest, parse_f4m
from subprocess import Popen, PIPE
import time
import re
import shlex


internal_api = Blueprint('internal_api', __name__, url_prefix='/internal/api')
internal_api.before_request(set_server_session)

external_api = Blueprint('external_api', __name__, url_prefix='/external/api')


@internal_api.route('/manifest/', methods=['POST'])
def wrk_url_list():
    """ Insert formatted segment file into session from manifest url."""
    post_data = request.json

    if 'host' not in post_data:
        return jsonify(result={'error': 'No host given.'}), 500
    host = post_data['host']

    bitrate_filter = ''
    if 'filter' in post_data:
        bitrate_filter = ('?filter=((systemBitrate>=' +
                          str(post_data['filter']['min']) +
                          ')%26%26(systemBitrate<=' +
                          str(post_data['filter']['max']) + '))')

    method = 'GET'
    if 'method' in post_data:
        method = post_data['method']
    method = 'HEAD' if method is 'HEAD' else 'GET'

    bitrates = None
    # Parse M3U8
    if(host.endswith('.m3u8')):
        output = parse_m3u8(host)
        if(output):
            g.server_session.set_wrk_get(build_wrk_requests(
                output['segments'], method)
            )
            return jsonify(bitrates=output['bitrates']), 200
        else:
            print('M3U8 manifest did not pass Tensor parsing.')
            return jsonify(err='M3U8 playlist could not be fetched.'), 500
    elif(host.endswith('.mpd')):
        output = parse_mpd(host)
        if(output):
            # g.server_session.set_wrk_get(output['segments'])
            bitrates = output['bitrates']
        # else:
        #     print('MPD manifest did not pass Tensor parsing.')
        #     return jsonify(err='MPD playlist could not be fetched.'), 500
    elif(host.endswith('Manifest') or host.endswith('manifest')):
        output = parse_manifest(host)
        if(output):
            # g.server_session.set_wrk_get(output['segments'])
            bitrates = output['bitrates']
    elif(host.endswith('.f4m')):
        output = parse_f4m(host)
        if(output):
            # g.server_session.set_wrk_get(output['segments'])
            bitrates = output['bitrates']

    capture_cmd = build_capture_cmd(host, bitrate_filter=bitrate_filter)
    p = Popen(shlex.split(capture_cmd), stdout=PIPE, stderr=PIPE)
    (output, err) = p.communicate()

    if(output):
        g.server_session.set_wrk_get(build_wrk_requests(
            output.decode('utf8').split(), method)
        )
        return jsonify(bitrates=bitrates), 200
    else:
        print(err)
        print('Segment list generation failed, unified_capture related.')
        return jsonify(), 500


@internal_api.route('/bench/get/', methods=['POST'])
def wrk_get():
    """ Use wrk to send get requests to an Origin """
    post_data = request.json
    if not g.server_session.wrk_get:
        print('Flask failed to retrieve the segment list from server-side ' +
              'session, something database related.')
        return jsonify(error='No segment file found'), 500

    if 'host' not in post_data:
        return jsonify(result={'error': 'No host given.'}), 500
    host = post_data['host']

    duration = 2
    if 'duration' in post_data:
        duration = post_data['duration']

    connections = 1
    if 'connections' in post_data:
        connections = post_data['connections']

    method = 'get'
    if 'method' in post_data:
        method = post_data['method']
    script = 'head.lua' if method is 'head' else 'get.lua'

    wrk_cmd = build_wrk_cmd(host, connections=connections, duration=duration,
                            timeout=duration)
    p = Popen(shlex.split(wrk_cmd), stdin=PIPE, stdout=PIPE, stderr=PIPE)
    (output, err) = p.communicate(
        input=json.dumps(g.server_session.wrk_get).encode('ascii')
    )
    result = parse_wrk_response(output)
    if(result):
        result['connections'] = connections
        return jsonify(result)
    else:
        return jsonify(), 500


@internal_api.route('/bench/post/', methods=['POST'])
def wrk_post():
    """ Use wrk to send post requests to an Origin """
    post_data = request.json

    if not g.server_session.segment:
        print('Flask failed to retrieve the segment list from server-side ' +
              'session, something database related.')
        return jsonify(error='No segment found'), 500

    if 'host' not in post_data:
        return jsonify(result={'error': 'No host given.'}), 500
    host = post_data['host']

    duration = 2
    if 'duration' in post_data:
        duration = post_data['duration']

    connections = 1
    if 'connections' in post_data:
        connections = post_data['connections']

    wrk_cmd = build_wrk_cmd(host, connections=connections, duration=duration,
                            timeout=duration, script='post.lua')
    p = Popen(shlex.split(wrk_cmd), stdin=PIPE, stdout=PIPE, stderr=PIPE)
    (output, err) = p.communicate(input=g.server_session.segment)

    result = parse_wrk_response(output)
    if(result):
        result['connections'] = connections
        return jsonify(result)
    else:
        return jsonify(), 500


@internal_api.route('/baseline/', methods=['POST'])
def baseline():
    """ Get baseline non-abr baseline metrics to server """
    baseline_request = request.json
    baseline_host = ''
    if 'host' in baseline_request:
        baseline_host = baseline_request['host']
    result = {}

    ping_command = 'ping -c 10 ' + baseline_host

    p1 = Popen(ping_command, stdout=PIPE, shell=True)
    (output, err) = p1.communicate()
    output = re.search(r'min/avg/max/mdev.=.(.*)/(.*)/(.*)/(.*).ms',
                       str(output))

    if(output):
        result['ping'] = {'avg': output.group(2)}

    wrk_cmd = build_wrk_cmd('http://' + baseline_host + '/50MB.zip',
                            threads=4, connections=20, duration=10,
                            timeout=10, close=False, script='init.lua')
    p2 = Popen(wrk_cmd, stdout=PIPE, shell=True)
    (output, err) = p2.communicate()

    result['throughput'] = parse_wrk_response(output)

    return jsonify(result)


@external_api.route('/loadtest/', methods=['POST'])
def loadtest():
    post_data = request.json
    print(post_data)
    print(request)

    if 'host' not in post_data:
        return jsonify(result={'error': 'No host given.'}), 500
    host = post_data['host']

    duration = 10
    if 'duration' in post_data:
        duration = post_data['duration']

    connections = [50, 75, 100, 125, 150, 175, 200]
    if 'connections' in post_data:
        connections = post_data['connections']

    method = 'GET'
    if 'method' in post_data:
        method = 'HEAD' if post_data['method'] == 'HEAD' else 'GET'

    output_format = 'JSON'
    if 'format' in post_data:
        output_format = 'ASCII' if post_data['format'] == 'ASCII' else 'JSON'

    capture_cmd = build_capture_cmd(host)
    p = Popen(shlex.split(capture_cmd), stdout=PIPE, stderr=PIPE)
    (output, err) = p.communicate()

    segment_list = ''
    if(output):
        segment_list = build_wrk_requests(output.decode('utf8').split(),
                                          method)
    else:
        print('Segment list generation failed, unified_capture related.')
        return jsonify(result={
            'error': 'Unified Capture failed to generate segment list with URL'
        }), 500

    loadtest_result = []
    for connection in connections:
        wrk_cmd = build_wrk_cmd(host, connections=connection,
                                duration=duration, timeout=duration)

        p = Popen(shlex.split(wrk_cmd), stdin=PIPE, stdout=PIPE, stderr=PIPE)
        (output, err) = p.communicate(
            input=json.dumps(segment_list).encode('ascii')
        )
        if output_format is 'ASCII':
            result = parse_wrk_response(output, 'ASCII')
            loadtest_result.append(str(connection) + ', ' + result + '\n')
        else:
            result = parse_wrk_response(output)
            result['connections'] = connection
            loadtest_result.append(result)

    if output_format == 'JSON':
        return jsonify(result=loadtest_result), 200
    elif output_format == 'ASCII':
        return ''.join(loadtest_result), 200
    else:
        return '', 200
