# Tensor
Tensor (Unified Streaming), formerly bachelorproject 2015-2016 (Abe Wiersma) 

Install procedure updated for and tested on Ubuntu 16.04 LTS.

Installing the pre-packaged version (once in venv)
-----------------------------------

    cd deployment/
    bash install-remote.sh

Installing for development
--------------------------

Python 3.X

    sudo apt-get install python3
VirtualEnv

    pip install virtualenv
    virtualenv venv

Misc bash tools

    sudo apt-get install libreadline6 libreadline6-deiv
    sudo apt-get install unzip
    sudo apt-get install cmake

Python Packages

    . venv/bin/activate
    pip install -r requirements.txt
    deactivate
Lua

    curl -R -O http://www.lua.org/ftp/lua-5.3.4.tar.gz
    tar zxf lua-5.3.4.tar.gz
    cd lua-5.3.4
    sudo make linux test
    sudo make install
LuaJIT

    wget http://luajit.org/download/LuaJIT-2.0.4.tar.gz
    tar zxf LuaJIT-2.0.4.tar.gz
    cd LuaJIT-2.0.4
    make && sudo make install
Luarocks

    wget http://luarocks.org/releases/luarocks-2.4.4.tar.gz
    tar zxpf luarocks-2.4.4.tar.gz
    cd luarocks-2.4.4
    ./configure; sudo make bootstrap
Packages required by Lua
    
    sudo luarocks install rapidjson
libgif
    
    sudo apt-get install libgif-dev
NodeJS (LTS)

    wget https://nodejs.org/dist/v8.11.3/node-v8.11.3.tar.gz
    tar zxpf node-v8.11.3.tar.gz
    cd node-v8.11.3
    ./configure; sudo make install
Bower

    sudo npm install -g bower
Grunt

    sudo npm install -g grunt
    sudo npm install -g grunt-cli

    npm install
    bower install
    grunt

Installing on remote -- Origin
----------

For PCP installation http://www.pcp.io/download.html

    sudo apt-get install pcp
    invoke-rc.d pmcd start
    invoke-rc.d pmie start
    invoke-rc.d pmlogger start


Running
-------
run.sh -- Development

Possible Errors
---------------

**MOD_WSGI trouble when deploying.**

1) Remove problematic package and install dependency

    sudo apt-get remove libapache2-mod-wsgi-py3
    sudo apt-get install apache2-dev
2) Install mod_wsgi in virtualenv with pip

    source . /venv_path/bin/activate
    pip install mod_wsgi
3) Install into Apache (system-wide)

    sudo /venv_path/bin/mod_wsgi-express install-module
    sudo touch /etc/apache2/mods-available/wsgi_express.load /etc/apache2/mods-available/wsgi_express.conf
Content of /etc/apache2/mods-available/wsgi_express.load

    LoadModule wsgi_module /usr/lib/apache2/modules/mod_wsgi-py35.cpython-35m-x86_64-linux-gnu.so
Content of /etc/apache2/mods-available/wsgi_express.conf

    WSGIPythonHome /venv_path
4) Enable the module and restart Apache.

    sudo a2enmod wsgi_express
    sudo service apache2 restart


Packaging Tensor
----------------
In Tensor's root development directory the **package** python script can
be found.
When run, this script will run grunt prod which minifies the Tensor project.
After minifying is complete the relevant production files will be packaged into
a tar archive located in the deployment folder.

The archive can then be distributed to the deployment server using scp.

    ./package
    scp deployment/tensor-0.1.0.tar.gz dude@repository.unified-streaming.com:/var/www/.../tensor-0.1.0.tar.gz
