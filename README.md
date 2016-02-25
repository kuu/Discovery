# Discovery

Ooyala Discovery Demo App

## Prerequisites
* shell & git
* Node.js

## Install
```
$ git clone git@github.com:kuu/Discovery.git
$ cd Discovery
$ npm install
```

## Configure
```
$ mkdir config
$ touch config/default.json
```
Edit `config/default.json` as follows:
```
{
  "server": {
    "host": "localhost",
    "port": 8080
  },
  "api": {
    "key": {Your Ooyala API Key},
    "secret": {Your Ooyala API Secret}
  }
}
```

## Run
```
$ npm start
```
Open `localhost:8080` with your browser.
