### Cache Config
- add to env file, then sst config the name, host, and port add cache policy
- add them to lambda function


### Add Mesh function
- env file config the mesh function point
- Add the config point to the environment variable in lambda config in the sst file.
- add each microservice access policy. then apply the policy to lambda config

### Add outbound
- add outbound url as env
- add outbound policy
- select the right with notification or websocket, if noticifcation, see applciaiton or watch, if app should also add the translte code