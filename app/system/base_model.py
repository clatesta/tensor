"""Extra functionality that is used by all models. It extends db.Model with
extra functions."""

from app import db
from app.system.utils import serialize_sqla
from datetime import datetime
import dateutil.parser


class BaseEntity(object):
    __table_args__ = {'sqlite_autoincrement': True}

    # Only json items if explicitly defined, and just print id when not defined
    json_excludes = tuple()
    jsons = None
    json_relationships = None
    json_relationship_ids = tuple()
    prints = ('id',)

    # Columns that every model needs
    id = db.Column(db.Integer, primary_key=True)
    created = db.Column(db.DateTime, default=datetime.now)
    modified = db.Column(db.DateTime, default=datetime.now,
                         onupdate=datetime.now)

    # Function used by print to print a model at server side.
    # It uses the prints attribute from the object to determine what values to
    # print
    def __repr__(self):
        string = '<%s(' % (type(self).__name__)

        for i, attr in enumerate(self.prints):
            if i:
                string += ', '
            string += '"%s"' % (getattr(self, attr))

        string += ')>'

        return string

    def __init__(self, **kwargs):
        for key, val in kwargs:
            setattr(self, key, val)

    # Function to convert a sqlalchemy object instance to a dictionary. This is
    # needed for json serialization of an object. The jsons attribute is used
    # to determine what values to serialize (password hashes and such should
    # not in there)
    def to_dict(self, exclude=True, **kwargs):
        attrs = {}

        if not self.jsons or not exclude:
            if exclude:
                jsons = (column.name for column in self.__table__.columns if
                         column.name not in self.json_excludes)
            else:
                jsons = (column.name for column in self.__table__.columns)
        else:
            jsons = self.jsons

        for column in jsons:
            value = serialize_sqla(getattr(self, column), **kwargs)
            attrs[column] = value

        if self.json_relationships:
            for rel in self.json_relationships:
                attrs[rel] = serialize_sqla(getattr(self, rel).all(), **kwargs)

        for rel in self.json_relationship_ids:
            attrs[rel] = tuple(a[0] for a in getattr(self, rel).values('id'))

        return attrs

    # Get all entries.
    @classmethod
    def get_all(cls):
        return cls.query.all()

    # Get entry by id.
    @classmethod
    def by_id(cls, _id):
        return cls.query.filter_by(id=_id).first()

    # Remove entry by id.
    @classmethod
    def remove_by_id(cls, _id):
        entry = cls.by_id(_id)

        if entry is None:
            return

        db.session.delete(entry)
        db.session.commit()

    # Get entries by id list.
    @classmethod
    def by_ids(cls, ids):
        try:
            return db.session.query(cls).filter(cls.id.in_(ids)).all()
        except:
            return []

    # Merge dictionary as object
    @classmethod
    def merge_dict(cls, obj, relationships={}, commit=True):

        # Get the correct entry from the database
        if 'id' in obj and obj['id']:
            entry = cls.by_id(obj['id'])
            if not entry:
                return None

        # If the dict doesn't contain id it means the entry does not exist yet
        else:
            entry = cls()

        # Remove id, created and modified, since those are things you want to
        # automaticaly update
        obj.pop('id', None)
        obj.pop('created', None)
        obj.pop('modified', None)

        column_names = tuple(column.name for column in cls.__table__.columns)

        # Update all values from the dict that exist as a column or a
        # relationship
        for key, value in obj.items():
            if key in column_names:
                columntype = str(cls.__table__.columns[key].type)
                if columntype[:7] == 'VARCHAR' and value is not None:
                    value = value.strip()
                elif columntype == 'DATE' and value is not None:
                    if isinstance(value, str):
                        value = dateutil.parser.parse(value)
                elif columntype == 'TIME' and value is not None:
                    if isinstance(value, str):
                        value = dateutil.parser.parse(value).time()

                setattr(entry, key, value)

            elif key in relationships:
                setattr(entry, key, relationships[key].by_ids(value))

        db.session.add(entry)
        if commit:
            db.session.commit()
        return entry

    # For future proofing use new_dict when creating new entries, so it could
    # become a separate function if needed
    new_dict = merge_dict

    # Get entries by filter.
    @classmethod
    def get_filtered(cls, **kws):
        if len(kws) > 0:
            return db.session.query(cls).filter_by(**kws).all()
        return cls.get_all()

    @classmethod
    def id_query(cls):
        return db.session.query(cls.id)

    @classmethod
    def extend_query(cls, base):
        if base is None:
            return cls.query
        return base
