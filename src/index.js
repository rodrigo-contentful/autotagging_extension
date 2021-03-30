import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { TextInput } from '@contentful/forma-36-react-components';
import { init } from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

// import createClient directly
//import * as contentful from 'contentful-management'
const contentful = require('contentful-management')

const ORG_ID="SOME_ORG_ID";
const CMA_TOKEN="CMA_TOKEN_ID";

let config_data = null;
const client = contentful.createClient({
  // This is the access token for this space. Normally you get the token in the Contentful web app
  accessToken: CMA_TOKEN,
})



export const App = ({sdk}) => {
  
 const [value, setValue] = useState(sdk.field.getValue() || 'sin valor value');

  const onExternalChange = value => {
    setValue(value);
  }

  // This config is in case, you want to match emails and teams from a file.json and not from Contentfuls teams.
  config_data = {};
  config_data = require('./config.json');
    
   
  const onChange = async e => {  

    var spaceID=sdk.ids.space;
    var envID=sdk.ids.environment;
    var entryID=sdk.ids.entry; 
    var currUserEmail=sdk.user.email; 
    //console.log(sdk)

    var users = new Map();
    for(var i = 0; i < config_data.user.length; i++) {
      var obj = config_data.user[i];
      users.set(obj.name, obj.tag);
  }
  var userTag=users.get(currUserEmail);

  
  // get org memebership
  var organizationMemberships = await client.getOrganization(ORG_ID)
  .then((organization) => organization.getOrganizationMemberships({'query': currUserEmail})) // you can add more queries as 'key': 'value'
 
  var curOrgId=organizationMemberships.items[0].sys.id;

  var userTeams=new Map();
  // get team memberships matching with a file and NOT Teams
  // client.getOrganization(ORG_ID)
  // .then((organization) => organization.getTeamMemberships({'query':"sys.organizationMembership.sys.id=61AXKr59JawbNVM2wMZ5Pu"}))
  // .then((response) => {
  //   for(var i = 0; i < response.total; i++) {
  //     var obj = response.items[i];
  //     var orgID = obj.sys.organizationMembership.sys.id;
  //       if (orgID==curOrgId) {
  //       userTeams.set(obj.sys.team.sys.id, obj.sys.team.sys.id);
  //       teamTest=obj.sys.team.sys.id
  //     }
      
  // }
  // })

  // todo: query is not working yet, need to find a way to do it.
  // instead I am looping in all Org ids and finding the correct one.
  var responseTeams = await client.getOrganization('')
  .then((organization) => organization.getTeamMemberships({'query':"sys.organizationMembership.sys.id=61AXKr59JawbNVM2wMZ5Pu"}))
    for(var i = 0; i < responseTeams.total; i++) {
      var obj = responseTeams.items[i];
      var orgID = obj.sys.organizationMembership.sys.id;
        if (orgID==curOrgId) {
        userTeams.set(obj.sys.team.sys.id, obj.sys.team.sys.id);
      }
  }

  // get team name
  for (var entry of userTeams.entries()) {
    var value = entry[1];
    var teamResult = await client.getOrganization(ORG_ID).then((organization) => organization.getTeam(value));
    userTag=teamResult.name
}


    // Clean Tags entry
await client.getSpace(spaceID)
.then((space) => space.getEnvironment(envID))
.then((environment) => environment.getEntry(entryID))
.then((entry) => {
  entry.metadata.tags = []
  return entry.update()
})
.then((entry) => console.log(`Entry ${entry.sys.id} updated.`))
.catch(console.error)

    // Update entry
await client.getSpace(spaceID)
.then((space) => space.getEnvironment(envID))
.then((environment) => environment.getEntry(entryID))
.then((entry) => {
  const myTag = {
      sys: {
        type: "Link",
        linkType: "Tag",
        id: userTag
      }
    }
  entry.metadata.tags.push(myTag)
  return entry.update()
})
.then((entry) => console.log(`Entry ${entry.sys.id} updated.`))
.catch(console.error)

  }

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, []);

  useEffect(() => {
    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    const detatchValueChangeHandler = sdk.field.onValueChanged(onExternalChange);
    return detatchValueChangeHandler;
  });

  return (
    <TextInput
      width="large"
      type="text"
      id="my-field"
      testId="my-field"
      value={value}
      onChange={onChange}
    />
  );
}

App.propTypes = {
  sdk: PropTypes.object.isRequired
};

init(sdk => {
  ReactDOM.render(<App sdk={sdk} />, document.getElementById('root'));
});

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
