"""main.py - Views for main app."""
from flask import render_template, session, Blueprint

main_blueprint = Blueprint('main', __name__, url_prefix='')


@main_blueprint.route('/', methods=['GET'])
def home():
    if 'segment_file' in session:
        return render_template('index.html', data={'ja': "nee"})
    else:
        return render_template('index.html', data={})
