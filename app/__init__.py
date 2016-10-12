from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
import datetime as dt
import json
import math
import os

VERSION = '0.1.0'

# Startup stuff
app = Flask(__name__)
app.config.from_object('config')

BASE_PATH = os.path.dirname(os.path.abspath(__file__)) + '/'
USP_LICENSE = BASE_PATH + app.config['USP_LICENSE']

db = SQLAlchemy(app)
from app.models import *  #noqa
db.create_all()

# Global jinja functions
app.jinja_env.globals.update(str=str)
app.jinja_env.globals.update(enumerate=enumerate)
app.jinja_env.globals.update(json=json)
app.jinja_env.globals.update(len=len)
app.jinja_env.globals.update(ceil=math.ceil)
app.jinja_env.globals.update(int=int)
app.jinja_env.globals.update(getattr=getattr)
app.jinja_env.globals.update(hasattr=hasattr)
app.jinja_env.globals.update(isinstance=isinstance)
app.jinja_env.globals.update(type=type)
app.jinja_env.globals.update(dict=dict)
app.jinja_env.globals.update(list=list)
app.jinja_env.globals.update(tuple=tuple)
app.jinja_env.globals.update(zip=zip)
app.jinja_env.globals.update(dt=dt)
app.jinja_env.globals.update(format=format)

# Import routes
from app.views.main import main_blueprint
from app.api import internal_api, external_api
app.register_blueprint(main_blueprint)
app.register_blueprint(internal_api)
app.register_blueprint(external_api)
