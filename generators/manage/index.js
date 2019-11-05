const Generator = require('yeoman-generator');
const shell = require('shelljs');
const yosay = require('yosay');
const chalk = require('chalk');
const spinner = require('ora');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument("devhubName", { type: String, required: false });
    this.argument("orgName", { type: String, required: false });
    this.argument("nonScratchOrgs", { type: Array, required: false });
    this.argument("scratchOrgs", { type: Array, required: false });
    this.argument("skipIntro", { type: Boolean, required: false });

    this.defaultDevHub = {alias:this.options.devhubName};
    this.defaultOrg =  {alias:this.options.orgName};

    this.nonScratchOrgs = this.options.nonScratchOrgs;
    this.scratchOrgs = this.options.scratchOrgs;
  }

  initializing() {
     // Start loading spinner
     this.loading = new spinner(
      { spinner:'dots',
        color : 'yellow' }
    );
    if(!this.options.skipIntro) {
      this.loading.start('Pulling DX defaults...');
    
             // Silently get the available orgs as JSON
             let orgsOutput = JSON.parse( shell.exec(' sfdx force:org:list --json', { silent: true } ).stdout );
             // Collect all non Scratch orgs
             this.nonScratchOrgs = orgsOutput.result.nonScratchOrgs;
             // Grab Default DevHub
             if(!this.defaultDevHub.alias){
               if(this.nonScratchOrgs.length > 0) {
                 this.defaultDevHub = this.nonScratchOrgs.find(org => org.isDevHub);
                 if(!this.defaultDevHub)
                 this.defaultDevHub =  {alias:'NONE'};
               }
               else {
                 this.defaultDevHub =  {alias:'NONE'};
               }
             }
             // Collect Scratch Orgs
             this.scratchOrgs  = orgsOutput.result.scratchOrgs;
             // Grab Default Scratch Org
             if(!this.defaultOrg.alias){
               if(this.scratchOrgs.length > 0) {
                 this.defaultOrg = this.scratchOrgs.find(org => org.isDefaultUsername);
                 if(!this.defaultOrg) {
                   this.defaultOrg =  {alias:'NONE'};
                 }
               }
               else {
                 this.defaultOrg =  {alias:'NONE'};
               }
             }
             // Show Yeoman and Stop Spinner   
             if(this.defaultDevHub.alias !== 'NONE') {
               // Stops Spinner and show success
               this.loading.succeed('Pulled defaults successfully');
                   // Tell yo to say all details we collected
                  this.log( yosay( chalk.redBright.underline('Welcome to DX \n') + 
                  `Connected Orgs : ${chalk.cyan(this.nonScratchOrgs.length)} \n` +
                  `Active Scratch Orgs : ${chalk.cyan(this.scratchOrgs.length)} \n\n` + 
                  `Default DevHub : ${chalk.cyan( this.defaultDevHub.alias )} \n` +
                  `Default Scratch : ${chalk.cyan( this.defaultOrg.alias )} `  ) ); 
    
             }
             else {
               // Stops Spinner and show failure
               this.loading.fail('Failed to pull defaults');
              // Tell yo to say you need to connect
              this.log( yosay( chalk.redBright('NEED TO CONNECT DEVHUB') )); 
             }
    }

  }
  
  prompting() {
      // setting a cancel option to go back
    const CANCEL_OPTION =  {
        key: 'c',
        name : chalk.inverse('Cancel'),
        value : 'cancel'
    };
    // set a nice seperator for list of options
    const SEPERATOR =  {
      type: 'separator', 
      line: '--------------'
    };
    // getting aliases from org list
    const getOrgOptions = function (orgNames) {
      const orgAliases = orgNames.map(org => org.alias);
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
      return orgOptions;
    }
    // dynamic options from org list for Devhub alias names
    let devhubOptions = getOrgOptions(this.nonScratchOrgs);
    // dynamic options from scratch org list for Scratch alias names
    let scratchOptions = getOrgOptions(this.scratchOrgs);   
    let allOrgAliases = [...scratchOptions, ...devhubOptions];

          devhubOptions.push(CANCEL_OPTION);
          devhubOptions.push(SEPERATOR);

          scratchOptions.push(CANCEL_OPTION);
          scratchOptions.push(SEPERATOR);

          allOrgAliases.push(CANCEL_OPTION);
          allOrgAliases.push(SEPERATOR);

    this.log('--------------------------------');
    const questions = [
      {
        type: 'list',
        name: 'orgCommand',
        message: 'Select Option :',
        choices:[
          {
            name:  'Open Org',
            value:  'open'
          },
          {
            name:  'Delete Scratch Org',
            value:  'delete'
          },
          {
            name:  'Connect Org',
            value:  'connect'
          },
          {
            name:  'Configure Defaults',
            value:  'settings'
          }
        ]
      },
      {
        type: 'list',
        name: 'configureOption',
        message: 'Change Defaults for :',
        when: function(answers) {
          return answers.orgCommand == 'settings' ? true : false;
        },
        choices:['DevHub','Scratch Org']
      },
      {
        type: 'rawlist',
        name: 'otherDevhub',
        message: 'Select other DevHub :',  
        default: this.defaultDevHub.alias,
        when: function(answers) {
          return answers.configureOption == "DevHub";
        },
        choices: devhubOptions
      },
      {
        type: 'list',
        name: 'scratchAliasName',
        message: 'Select Existing Scratch org :',  
        default: this.defaultOrg.alias,
        when: function(answers) {
          return answers.orgCommand == "delete" || answers.configureOption == "Scratch Org";
        },
        choices: scratchOptions
      },
      {
        type: 'list',
        name: 'orgAliasName',
        message: 'Select Org :',  
        default: this.defaultOrg.alias,
        when: function(answers) {
          return answers.orgCommand=="open";
        },
        choices: allOrgAliases
      }
    ];

    return this.prompt(questions).then(answers => {
          this.props = answers;
    });
  }
    
  configuring() {
 
    let sfdxCommand =' sfdx';
    let runCommand = false;
    let successMSG,failMSG ='';
    // what to do with the org ?
    switch (this.props.orgCommand) {
          case 'connect':
            this.composeWith(require.resolve('../connect'));
          break;
      case 'open':
          if(this.props.orgAliasName != 'cancel'){
            sfdxCommand +=' force:org:open';
            sfdxCommand += ' -u ' + this.props.orgAliasName;
            runCommand = true;
            successMSG = 'Will open org ' + this.props.orgAliasName;
            failMSG='Failed to open org';
          }
          break;
      case 'delete':
          if(this.props.scratchAliasName != 'cancel'){
              sfdxCommand +=' force:org:delete';
              sfdxCommand += ' -u ' + this.props.scratchAliasName;
            if(this.options.devhubName)
              sfdxCommand += ' -v ' + this.options.devhubName;
              sfdxCommand +=' -p'; // No prompt to confirm deletion.
              runCommand = true;
              successMSG = 'Deleted org ' + this.props.scratchAliasName + ' successfully !'
              failMSG='Failed to delete org';
          }
          break;

      case 'settings':
          successMSG = chalk.green(`set default ${ chalk.greenBright(this.props.configureOption) } configuration successfully! \n`);
          failMSG= chalk.redBright('Failed to configure default org');
          // which option to configure
            switch (this.props.configureOption) {
              case 'DevHub':
                if(this.props.otherDevhub != 'cancel') {
                  sfdxCommand +=' force:config:set defaultdevhubusername=' + this.props.otherDevhub + ' -g';
                  runCommand = true;
                }
                  break;
              case 'Scratch Org':  
              if( this.props.scratchAliasName != 'cancel'){
                sfdxCommand +=' force:config:set defaultusername=' + this.props.scratchAliasName + ' -g';
                runCommand = true;
              }
                break;
              default:
                  runCommand = false;
                  this.composeWith(require.resolve('../app'),{  devhubName : this.props.otherDevhub,
                                                                orgName : this.props.scratchAliasName 
                                                                });
            }
          
          break;
      default:
        this.log('option not supported');
        //shell.exit(1);
    }
      // check if need to run command
      if(runCommand){
        this.loading.start('Run : ' + chalk.yellow(sfdxCommand)+'\n');
        if( shell.exec(sfdxCommand).code === 0 ){

          this.loading.succeed(successMSG); 
          this.composeWith(require.resolve('../app'),{  devhubName : this.props.otherDevhub,
                                                        orgName : this.props.scratchAliasName 
                                                      });
        }
        else {
          this.loading.fail(failMSG);
        }
      }

      // abort option
      if(this.props.otherScratch == 'cancel' || this.props.otherDevhub == 'cancel' || this.props.orgAliasName == 'cancel') {
        this.composeWith(require.resolve('../app'),{   devhubName : this.options.devhubName,
                                                          orgName : this.options.orgName 
                                                    });
      }
  }

  writing() {
    
  }

  end() {
    
  }

};
