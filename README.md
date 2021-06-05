### Video Conferencing
 1. Install npm packages in app and server folders (npm i)
 2. Install redis server - 
 ```bash
 curl -O http://download.redis.io/redis-stable.tar.gz
 tar xzvf redis-stable.tar.gz
 cd redis-stable
 make
 make test
 sudo make install
```
or with homebrew  

 3. Run redis server 
 4. Run client & server
 5. Check ip of client and open config file of server -> goto the webrtctransport, listenip. Replace the ip with client ip address (shown in react client terminal)
 6. Open server url (same IP as client, port no : 8883, change in config file if needed), accept risk and continue, close server page.
 7. Open client url (not localhost one, the local IP url shown in react terminal, can change port number in config file)
 8. Done :smiley:
