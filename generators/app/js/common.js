
'use strict';
const chalk = require('chalk');
const shell = require('shelljs');
const spinner = require('ora');


const CANCEL_OPTION =  {
    name : chalk.inverse('Cancel'),
    value : 'cancel'
};

const OPEN_OPTION =  {
    name : chalk.inverse('Open'),
    value : 'open'
};

const SEPERATOR =  {
    type: 'separator', 
    line: '--------------'
};

module.exports = {
    getOrgDefaults: function() {
        let output = {
            nonScratchOrgs:[],
            scratchOrgs:[],
            defaultDevHub:{
                alias:'NONE'
            },
            defaultOrg:{
                alias:'NONE'
            }
        };
        this.loading = new spinner(
            { spinner:'monkey',
              color : 'yellow' }
          ).start(chalk.yellow('Loading org list...\n'));
        // Silently get the available orgs as JSON
        let orgsCommand = shell.exec(' sfdx force:org:list --json', { silent: true } );
        if(orgsCommand.code === 0){
                
                    let orgsOutput = JSON.parse( orgsCommand.stdout );
                    // Collect all non Scratch orgs
                    output.nonScratchOrgs = orgsOutput.result.nonScratchOrgs;
                    // Grab Default DevHub
                    if(output.nonScratchOrgs.length > 0) {              
                            output.defaultDevHub = output.nonScratchOrgs.find(org => org.isDevHub);
                            if(!output.defaultDevHub) 
                                output.defaultDevHub =  {alias:'NONE'};
                    }
                    else {      
                        output.defaultDevHub =  {alias:'NONE'};
                    }
                
                    // Collect Scratch Orgs
                    output.scratchOrgs  = orgsOutput.result.scratchOrgs;
                    // Grab Default Scratch Org
                    if(output.scratchOrgs.length > 0) {
                        output.defaultOrg = output.scratchOrgs.find(org => org.isDefaultUsername);
                        if(!output.defaultOrg) {
                            output.defaultOrg =  {alias:'NONE'};
                        }
                    }
                    else {
                        output.defaultOrg =  {alias:'NONE'};
                    }
                // Stops Spinner and show success
                this.loading.succeed('Pulled defaults successfully');   
                
                if(output.defaultDevHub.alias !== 'NONE') {
                    output.yosay = chalk.redBright.underline('Welcome to DX \n') + 
                    `Connected Orgs : ${chalk.cyan(output.nonScratchOrgs.length)} \n` +
                    `Active Scratch Orgs : ${chalk.cyan(output.scratchOrgs.length)} \n\n` + 
                    `Default DevHub : ${chalk.cyan( output.defaultDevHub.alias )} \n` +
                    `Default Scratch : ${chalk.cyan( output.defaultOrg.alias )} ` ;
                }
                else {
                    output.yosay = chalk.redBright('NEED TO CONNECT DEVHUB');
                }
            }
            else {
                // Stops Spinner and show failure
                this.loading.fail('Failed to pull defaults');
            }
        return output;
    },

    getOrgOptions : function (orgs) {
        const orgAliases = orgs.map(org => org.alias);
        let orgOptions = [ SEPERATOR ];
        if( orgAliases.length > 0 ){
          let order = 1;
          orgAliases.forEach(function(orgAlias) {
            let orgOption = {
              key : order,
              name : orgAlias,
              value : orgAlias
            }
            orgOptions.push(orgOption);
            order +=1;
          });
        }
        orgOptions.push(SEPERATOR);
        return orgOptions;
    },

    convertToListOptions:function(options,includeCancel) {
        let listOptions = [ SEPERATOR ];
        if( options.length > 0 ){
            let order = 1;
            options.forEach(function(item) {
              let listItem = {
                key : order,
                name : item.charAt(0).toUpperCase() + item.slice(1),
                value : item
              }
              listOptions.push(listItem);
              order +=1;
            });
          }
          listOptions.push(SEPERATOR);
          if(includeCancel)
          listOptions.push(CANCEL_OPTION);
          return listOptions;
    },

    getSObjectDescribe:function(sobjecttype,targetusername,usetoolingapi) {
        let schemaCommand = 'sfdx force:schema:sobject:describe';
            schemaCommand += ' --json';
            schemaCommand += ' -u ' + targetusername;
            schemaCommand += ' -s ' + sobjecttype;
        
        if(usetoolingapi)
            schemaCommand += ' -t ';
        
        this.loading.start('getting describe object : ' + sobjecttype + ' from ' + targetusername +'\n');
        let output = {};
        let commandOutput = shell.exec( schemaCommand , { silent: true } );
        if(commandOutput.code === 0){
         let sobject = JSON.parse( commandOutput.stdout );
         output = {
                    label : sobject.result.label,
                    name  : sobject.result.name
                }
                
                output.fields = [];
            output.createable = [];
            output.updateable = [];
            output.externalIds = [];

            if(sobject.result.fields){
                sobject.result.fields.forEach(function(field) {
                    const item = {
                        value: field.name,
                        name: field.label,
                        checked: false
                    }
                    //all fields
                    output.fields.push(item);
                    //create
                    if(field.createable)
                    output.createable.push(item);
                    //update
                    if(field.updateable)
                    output.updateable.push(item);
                    // external Ids
                    if(field.externalId || field.name == 'Id'){
                    output.externalIds.push(item);
                    }
                });
            }
                this.loading.succeed('Pulled fields successfully from ' + output.name );   
                return output;
            }
            else {
                output = {
                    label : 'Account',
                    name : 'Account',
                    createable : [SEPERATOR,CANCEL_OPTION],
                    updateable : [SEPERATOR,CANCEL_OPTION]
                }
                this.loading.fail('Failed to pull fields from ' + sobjecttype); 
                return output;
            }
        
    },

    getPathDirectories: function(folderPath) {
        let pathFolders = shell.ls('-L',folderPath);
        let paths = [];
        
        pathFolders.forEach(function(folder) {
            let relativePath = folder.substring(folderPath.length,folder.length );
    
                let pathOption = {
                name : relativePath,
                value : folder
                }
                paths.push(pathOption);
        });

        paths.push(CANCEL_OPTION);
        return paths;
    },
    getJsonPathFiles: function(folderPath) {
       
        let paths = [];
        shell.ls('-A',folderPath).forEach(function (file) {
                if(file.indexOf('.json') > -1){
                    let pathOption = {
                    name : file,
                    value : file
                    }
                    paths.push(pathOption);
                }
        });

        paths.push(OPEN_OPTION);
        return paths;
    },
    getCSVPathFiles: function(folderPath) {
       
        let paths = [];
        shell.ls('-A',folderPath).forEach(function (file) {
                if(file.indexOf('.csv') > -1){
                    let pathOption = {
                    name : file,
                    value : file
                    }
                    paths.push(pathOption);
                }
        });

        paths.push(OPEN_OPTION);
        return paths;
    },
    open: function(path) {
        shell.exec(' open '+ path);
    },
    openCode: function(path) {
        shell.exec(' code '+ path);
    },
    sayText: function(textString) {
        shell.exec(' say \''+ textString + '\'');
    }
  }

