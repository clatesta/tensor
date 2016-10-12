from app import db
from app.system import BaseEntity
import uuid


class Session(db.Model, BaseEntity):
    __tablename__ = 'session'

    prints = ('id', 'subject')

    uuid = db.Column(db.String(36))
    wrk_get = db.Column(db.PickleType())

    def __init__(self, wrk_get=None):
        ''' Initialize a session '''
        self.uuid = str(uuid.uuid4())
        self.wrk_get = wrk_get

    def set_wrk_get(self, output):
        self.wrk_get = output
        db.session.add(self)
        db.session.commit()
        return(self)

    @classmethod
    def new_session(cls):
        new_ses = cls()
        db.session.add(new_ses)
        db.session.commit()
        return new_ses

    @classmethod
    def by_uuid(cls, uuid):
        return cls.query.filter_by(uuid=uuid).first()
