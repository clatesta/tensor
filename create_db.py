#!/usr/bin/env python3

from app import app, db
from app.models import *  # noqa
import sys
import os
from glob import glob

if not app.config['DEBUG']:
    sys.exit(1)

filelist = glob("/tmp/*.sqlite")
filelist += (glob("/tmp/*.db"))
for f in filelist:
    os.remove(f)

db.drop_all()
db.create_all()
