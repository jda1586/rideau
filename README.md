Rideau
======================

### Running instructions: 

 - Clone or download the latest version of it.
 - Install node and npm on the server or computer that will host the project. It is highly recommended to install Node & NPM with NVM (Node Version Manager), please refer to: https://github.com/creationix/nvm
 - Ensure that you have NPM installed by running "npm -v" on the command line interface
 - Install "forever" with "npm install forever -g"
 - Copy the ".env-template" file and paste it in the same location
 - Rename the copied env template file to only ".env" and set the desired variables
 - Install the project by running "npm install"
 - Run the project temporarily with "npm start" *or* run it forever with "nohup npm start &"
 - Verify that the project is running by ensuring that the forever's PID is visible with "forever list"
 - Load the site on the address localhost:4004 (or the selected port on rideau/www file or .env file)
 
### Database structure: 

To be done