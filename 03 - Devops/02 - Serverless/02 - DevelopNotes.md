## Basic Things

### Development notice:
- commit message must be in the format feat(PRD...): some info or fix(PRD....): some info

## SST Config

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

### SST Config Code
```ts

```



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

## Getting From Request

```ts
const request = getStandardPlatformRequest<EmptyRequestType>(globalContextService);
const requestBody = validateRequestInput(
    request.body ?? {},
    CreateAccountFromLegacySchoolsAppRequestSchema,
);

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

## Validate
```ts
export const CreateOAuthClientRequestSchema = z.object({
    clientName: z.string(),
    redirectUris: z.array(z.string()).optional(),
    scopes: z.array(z.enum(['manage:optus-subscription', 'create:account', 'read:account'])),
    Authorization: z
        .string()
        .regex(/^Basic\s+[\d+/A-Za-z]+=*$/, 'Invalid Basic auth format')
        .transform((header) => {
            // Extract the base64 part after "Basic "
            const base64Credentials = header.replace(/^Basic\s+/, '');
            try {
                // Decode base64
                const decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');

                // Split on first colon only (passwords can contain colons)
                const colonIndex = decoded.indexOf(':');
                if (colonIndex === -1) {
                    throw new Error('Invalid credentials format');
                }

                const clientId = decoded.slice(0, Math.max(0, colonIndex));
                const clientSecret = decoded.slice(Math.max(0, colonIndex + 1));

                return { clientId, clientSecret };
            } catch {
                throw new Error('Invalid base64 encoding');
            }
        }),
});

export type CreateOAuthClientRequest = z.infer<typeof CreateOAuthClientRequestSchema>;
```


## DynamoDB

- electrodb update will create a new item if it cannot find matching item, which is not good https://electrodb.dev/en/mutations/update/
- when use set in dynamoDB, when you update, you can not make it [] to clear the array, at list one
- for above problem, you can use list as type, once you do this, you need to ensure the list has unique ulids before updating