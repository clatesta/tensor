#!/bin/bash
## http://unix.stackexchange.com/questions/199633/how-to-check-from-bash-if-package-exists-in-debian

wd=`pwd`
directory=/var/www/tensor

version=0.1.0
url=http://usp.abewiersma.nl/deployment/tensor-$version.tar.gz

function check_continue() {
    if [[ $1 = '-y' ]]; then
        return 1
    fi
    echo "Do you want to continue? [y/n]"
    input=""
    read input
    if [[ $input = [yY] ]]; then
        return 1
    else
        return 0
    fi
}

function package_exists() {
    return `dpkg -l $1 &> /dev/null`
}

function install_tensor() {
    hostname="usp.tensor.local"

    if ! curl --output /dev/null --silent --head --fail "$url"; then
        echo "Failed to retrieve tensor from repo."
        exit 1
    fi

    if [ ! -d $directory ]; then
        mkdir $directory
    fi
    cd $directory

    wget $url
    tar -xf tensor-$version.tar.gz
    rm tensor-$version.tar.gz
    
    cd $wd

    touch /tmp/app.db
    chmod 777 /tmp/app.db
}


function install_lua() {
    command -v cmake &>/dev/null || { 
        sudo apt-get -y install cmake; 
    }
    command -v unzip &>/dev/null || { 
        echo "I require unzip, installing...."
        sudo apt-get install unzip 
    }
    sudo apt-get -y install libreadline-dev 
    sudo apt-get install lib32ncurses5-dev

    wget http://www.lua.org/ftp/lua-5.1.5.tar.gz
    tar zxpf lua-5.1.5.tar.gz
    cd lua-5.1.5
    make linux && sudo make install

    cd $wd
    wget http://luarocks.org/releases/luarocks-2.2.2.tar.gz
    tar zxpf luarocks-2.2.2.tar.gz
    cd luarocks-2.2.2
    ./configure; sudo make bootstrap

    cd $wd
    sudo luarocks install rapidjson
}

function install_python3() {
    command -v python3 &>/dev/null || { 
        echo "I require python3, installing" >&2; sudo apt-get -y install python3; 
    }
    command -v pip3 &>/dev/null || {
        echo "ERhm this is weird, pip comes installed with new python, you must be running an older system, incompatibilities might occur when running mod_wsgi" >&2; sudo apt-get -y install python3-pip;
    }
    sudo pip3 install virtualenv

    cd $directory
    virtualenv -p python3 ./venv
    source ./venv/bin/activate     # enter virtual environment
    pip install -r requirements.txt
    python3 create_db.py
    deactivate
    chmod 777 /tmp/app.db
    cd $wd
}

function install_mod-wsgi3() {
    echo "Installing the mod_wsgi module for apache"
    if package_exists libapache2-mod-wsgi ; then
        echo "Tensor requires mod_wsgi for python3, removing old mod_wsgi"
        sudo a2dismod wsgi
        sudo apt-get -y remove libapache2-mod-wsgi
    fi

    if ! package_exists apache2-dev ; then
        echo "Tensor requires apache2-dev for mod_wsgi install, installing"
        sudo apt-get -y install apache2-dev
    fi

    echo "Installing mod-wsgi3 in the tensor virtualenv"
    cd $directory
    source ./venv/bin/activate     # enter virtual environment
    pip install mod_wsgi
    sudo ./venv/bin/mod_wsgi-express install-module
    deactivate
    cd $wd

    cat > /etc/apache2/mods-available/wsgi_express.conf << END
    WSGIPythonHome /var/www/tensor/venv
END
    # This probably fails on older systems, we'll see.
    cat > /etc/apache2/mods-available/wsgi_express.load << END
    LoadModule wsgi_module /usr/lib/apache2/modules/mod_wsgi-py34.cpython-34m.so
END
    # Enable the 'new' and 'improved' mod_wsgi
    sudo a2enmod wsgi_express
}

function install_apache_conf_file() {
    echo "Installing the apache conf file .."
    cat > /etc/apache2/sites-available/usp-tensor.conf << END
    <VirtualHost *:80>
        ServerName usp.tensor.local
        ServerAdmin webmaster@localhost

        WSGIScriptAlias / /var/www/tensor/app.wsgi
        <Directory /var/www/tensor/abe/>
            Require all granted
        </Directory>

        Alias /static /var/www/tensor/app/static
        <Directory /var/www/tensor/app/static/>
            Require all granted
        </Directory>

        ErrorLog /var/log/apache2/error-tensor.log
        LogLevel warn
        CustomLog /var/log/apache2/access-tensor.log combined
    </VirtualHost>
END

    echo " " >> /etc/hosts
    echo "127.0.0.1 usp.tensor.local " >> /etc/hosts

    cd /etc/apache2/sites-enabled
    sudo a2ensite usp-tensor
    sudo a2dissite 000-default
    cd $wd

    sudo service apache2 restart
}
## -------------------------------------------------------------------------- ##
## Main
## -------------------------------------------------------------------------- ##
echo "This script will install USP tensor in /var/www/tensor."

check_continue $1

# check if the reply was 'y'
if [ $? -eq 0 ]; then
    echo "Ok, exiting."
    exit 1
else
    echo "Ok, continuing ..."
fi

if ! package_exists apache2 ; then
    echo "Tensor requires apache2, please install before running this script."
    exit 1
fi

install_tensor
install_lua
install_python3
install_mod-wsgi3
install_apache_conf_file

echo "Ok, all done!"
echo "After installing the license key in the app directory, restart apache and open $hostname in your browser, it should look similar to 'stats.unified-streaming.com'"

## -------------------------------------------------------------------------- ##