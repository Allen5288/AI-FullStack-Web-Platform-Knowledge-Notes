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
- select the right with notification or websocket, if notification, see application or watch, if app should also add the translate code



## Geting from Auth

```ts
const authDetails = globalContextService.getAuthorisation();
const uid = authDetails.user?.id;

const request = getStandardPlatformRequest<UpdateUserProfileRequest>(globalContextService);
let body = request.body;

const uid = _event.pathParameters?.uid ?? undefined;
if (!uid) {
    throw new BadRequestError('Missing uid');
}

```

## Caching Usage

```ts
const cacheKey = `${GET_WEARABLE_CONTACTS_CACHE_PREFIX}${deviceId}`;
const cacheResult = await this.cacheHelperService.get<WearablePhoneContactResponse[]>(cacheKey);
await this.cacheHelperService.set(cacheKey, contacts);


const cache = await this.cacheService.getString(key.toLowerCase()) as string;
return cache ? JSON.parse(cache) as T : undefined;
await this.cacheService.setString(key.toLowerCase(), data ? JSON.stringify(data) : 'undefined', { ttl: ttlInSeconds });
await this.cacheService.deleteKey(key.toLowerCase());
```