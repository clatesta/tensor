#!/bin/bash

source ./venv/bin/activate
python3 create_db.py
chmod 777 /tmp/app.db
deactivate
