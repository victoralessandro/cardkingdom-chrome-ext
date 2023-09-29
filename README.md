## Setup and install

1. Open your google spreadsheet and copy the file ID (its a long string, you'll finded as a path param in the url).
2. Open `popup.js` file, paste the ID into the `_FILE_ID` constant and save your changes.
3. In your Chrome browser, navigate to [Chrome Extensions](chrome://extensions/ "Chrome Extensions").
4. Enable Developer mode.
5. Click on "Load unpacked" button.
6. Select the project folder.
7. Copy the extension ID.
8. Navigate to [the Google Console](https://console.cloud.google.com/ "the Google Console") and create a project.
9. Once created, navigate to [the credentials page](https://console.cloud.google.com/apis/credentials "the credentials page") and create a OAuth2.0 client ID. When filling up the form, use the chrome extension ID copied before.
10. Copy the new client id and open the `manifest.json` file and pasted into `client_id`key.

## Use
Navigate to https://www.cardkingdom.com/ and navigate to a magic card page, open the extension, set your sheet name and click add.
