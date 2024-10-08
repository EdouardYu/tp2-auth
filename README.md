install npm: 
sudo apt-get install -y nodejs
sudo apt-get install npm
npm install -g npm@latest
sudo npm install -g express-generator 

Mongodb: 
    wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -

    sudo apt-get install gnupg
    wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -

    echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.2 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list

    sudo apt-get update

    sudo apt-get install -y mongodb-org

    sudo systemctl start mongod

    IF "Failed to start mongod.service: Unit mongod.service not found" 
        sudo systemctl daemon-reload

    sudo systemctl status mongod

    sudo systemctl enable mongod


https://medium.com/cyber4people/setup-mongodb-in-kali-linux-3ab86731e3ec



npm install -g nodemon

