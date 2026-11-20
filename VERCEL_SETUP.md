# Vercel setup quick guide

1. Push the `escalate360` project folder contents to a GitHub repository.
2. Import that repository into Vercel.
3. Keep `SERVICENOW_INTEGRATION_ENABLED=false` for the first deployment.
4. Deploy and test the prototype flow using the sample incident list.
5. For real ServiceNow integration, first ask your ServiceNow platform team to build and secure the Scripted REST API described in README.md. Confirm table names, assignment group sys_id, caller authentication, incident lookup, chaser notification behaviour and response schema.
6. Add the approved integration variables in Vercel Project Settings → Environment Variables. Store the bearer token as a secret; never commit it to GitHub.
7. Only then set `SERVICENOW_INTEGRATION_ENABLED=true` in a non-production environment and test end-to-end.

The portal currently uses sample incident records. It is not a drop-in widget for ServiceNow Service Portal: the Service First administrator must add a launch button/link and pass the incident context securely. The browser app itself can be hosted on Vercel.


## Service First launch context
Configure the ServiceNow Escalate button to open the deployed Vercel URL and pass the current incident's number and sys_id, for example:
`https://your-app.vercel.app/?incident_number=${number}&sys_id=${sys_id}`

The incident number is auto-populated and read-only in the portal. The app calls `/api/incident-context` to retrieve the incident details. For production, pass `sys_id` and validate the logged-in caller and incident permissions in the ServiceNow Scripted REST API. Do not rely on query-string values as authentication or authorization.
