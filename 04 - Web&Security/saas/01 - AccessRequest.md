### What is this system for? 🤔

At a high level, this is a **permission system** that allows a "Support User" to request temporary access to view the data of a specific user, group, or organisation. Think of it like a support agent at a company needing to look at your account details to help you with a problem. Instead of having permanent access (which is bad for security), they must create a formal request that is tracked, needs approval, and likely expires.

The entire workflow looks like this:
1.  A **Support User** decides they need to see someone's data.
2.  They make a **POST** request to create an "access request".
3.  The system sends a **verification code** to the owner of the data being requested (e.g., the user whose profile they want to see). This acts as a consent mechanism.
4.  To approve the request, an **Admin** or the Support User (after getting the code from the data owner) makes a **PUT** request with the verification code.
5.  Once approved, other parts of the system can use the `checkAccessRequest` method to confirm that the Support User is now allowed to view the data.
6.  All actions (approve/reject) are logged for auditing purposes.

***

### Endpoint-by-Endpoint Explanation

Here is a breakdown of what each specific API endpoint does.

#### **`POST /graph/access-requests`**
* **Purpose**: To **create a new request** for access.
* **How it works**: A support user sends a request specifying whose data they want to access (a user, org, or group). The system creates a request in the database marked as "pending" (`granted:false`) and sends a verification code to the data owner.

#### **`PUT /graph/access-requests/approve`**
* **Purpose**: To **approve** a pending access request.
* **How it works**: An admin, or a support user who has obtained the verification code from the data owner, calls this endpoint. The system updates the request's status to `granted:true` and records who approved it. It also sends an audit log to track this action.

#### **`PUT /graph/access-requests/reject`**
* **Purpose**: To **reject** (and delete) a pending access request.
* **How it works**: Similar to approving, an admin or support user with the verification code can reject the request. This deletes the request from the database and logs the rejection for auditing.

#### **`GET /graph/access-requests?granted=false`**
* **Purpose**: To **list all pending** access requests.
* **How it works**: This is used to see all the requests that are currently waiting for approval or rejection.

#### **`GET /graph/access-requests?userId={userId}`**
* **Purpose**: To **list all requests made by a specific support user**, both pending and approved.
* **How it works**: You provide the ID of a support user, and the API returns every access request they have ever made.

#### **`GET /graph/access-requests?granted=false&userId={userId}`**
* **Purpose**: To **list all pending requests made by a specific support user**.
* **How it works**: This combines the two previous `GET` requests. It's useful for a support user to see the status of their own outstanding requests.

#### **`GET /graph/access-requests?userId={userId}&requestedProfile={profileId}`**
* **Purpose**: To **get a very specific access request**.
* **How it works**: This checks if a particular support user (`userId`) has an access request for a specific profile (`requestedProfile`). This is useful for checking the status of one particular request.

***

### Common Method and Your Notes Explained

#### **`checkAccessRequest(userId, requestedProfile)`**
This isn't an endpoint that clients call directly. It's an **internal function** that other microservices would use. For example, if a support user tries to load a user's profile page, the backend service for that page would first call `checkAccessRequest` to see if that support user has an approved, active request to view that specific profile. It's the "gatekeeper" that enforces the permissions.

#### Your Notes and Suggestions
You've made some excellent points at the top of your document. Here’s what they mean:

* **How to use the verification code?**: The code is a security measure to ensure **consent**. The system sends it to the owner of the data (the "requested profile"). The support user must then ask that person for the code and submit it with the `approve` request. This proves the data owner agrees to let the support user see their data.
* **Suggestion: Add new permissions field**: This is a great idea. Right now, access is all-or-nothing ("view profile/data"). Your suggestion is to make it more granular. For example, you could specify permissions like `view_basic_profile`, `view_contact_info`, or `view_activity_log`.
* **Suggestion: Add duration type**: Another excellent security improvement. Instead of access being granted forever, this would allow for setting a time limit (e.g., "1 day," "1 week"). The system would then automatically set an expiry date (`expiresAt`), and after that time, the access would be revoked. This principle is known as **"Just-In-Time Access."**