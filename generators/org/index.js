const Generator = require('yeoman-generator');
const shell = require('shelljs');
const chalk = require('chalk');
const spinner = require('ora');
const yosay = require('yosay');
const helper = require('../app/js/common.js');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument("devhubName", { type: String, required: false });
    this.argument("orgName", { type: String, required: false });
    this.argument("projectPath", { type: String, required: false });
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

        // Set the path store the config file
        if(this.options.projectPath) {
          this.basePath = this.options.projectPath +'/config';
        }
        else {
          this.basePath = this.destinationPath()+'/sfdx_logs';
          if (!shell.test('-d', this.basePath)) {   
            shell.mkdir(this.basePath);
          }
        }

        this.hasProjectName = this.options.projectPath ? true:false;

        if(!this.options.skipIntro) {
          const output = helper.getOrgDefaults();
    
          this.defaultDevHub = output.defaultDevHub;
          this.defaultOrg = output.defaultOrg;
          this.nonScratchOrgs = output.nonScratchOrgs;
          this.scratchOrgs = output.scratchOrgs;
    
          this.log( yosay( output.yosay )); 
         
        }
  }

  prompting() {  

    // getting org options from backend
    const orgOptionsChoices = this.fs.readJSON(this.sourceRoot()+'/choices/org-options.json'); 
  
    this.log('--------------------------------');
    // initial questions to set a new scratch org
    const orgQuestions =  [
        {
          type: "input",
          name: "devhubName",
          message: "DevHub alias name",
          default: this.options.devhubName,
          when: !this.options.devhubName,
          validate: function(value) {
            return value ? true : 'Please enter a name';
          }
        },
        {
          type: "input",
          name: "scratchOrgName",
          message: "Your Scratch Org name",
          validate: function(value) {
            return value ? true : 'Please enter a name';
          },
        },
        {
          type: "input",
          name: "adminEmail",
          message: "Admin Email",
          default: 'yuval.vardi@ncino.com',
          validate: function(value) {
            return value ? true : 'Please enter email';
          }
        },
        {
          type: "confirm",
          name: "hasSampleData",
          message: "Add Sample Data",
          default: false
        }, 
        {
          type: "input",
          name: "numberOfDays",
          message: "Number of days",
          default: '30'
        },
        {
          type: "input",
          name: "orgDescription",
          message: "Org Description"
        },
        {
          type: "confirm",
          name: "isDefault",
          message: "Set as default org",
          default: true
        },
        {
          type: "confirm",
          name: "useDefaultConfiguration",
          message: "Use Existing Configuration File ? ",
          default: false
        }
    ];
    // optional questions options coming from templates
    const aditionalQuestions =[
      {
        type: 'list',
        name: 'orgEdition',
        message: 'Choose Edition:',
        when : function(answers) {
            return !answers.useDefaultConfiguration;
        },
        choices: orgOptionsChoices.orgEdition
      },    
      {
        type: 'list',
        name: 'orgLocal',
        message: 'Choose Country:',  
        default: 'US',
        when : function(answers) {
          return !answers.useDefaultConfiguration;
        },
        choices: orgOptionsChoices.orgLocal
      }, 
      {
        type: 'list',
        name: 'orgLanguage',
        message: 'Choose Language:',  
        default: 'en_US',
        when : function(answers) {
          return !answers.useDefaultConfiguration;
        },
        choices: orgOptionsChoices.orgLanguage
      },
      {
        type: 'checkbox',
        name: 'orgFeatures',
        message: 'Which features would you like to enable?',
        validate: function(value) {
          return value ? true : 'Please enter at least one selection';
        },
        when : function(answers) {
          return !answers.useDefaultConfiguration;
        },
        choices: orgOptionsChoices.orgFeatures
      }
    ];

    // all Questions combined
    const questions = [...orgQuestions, ...aditionalQuestions];
    this.props = [];
  
    return this.prompt(questions).then(answers => {
      // asign all answers to this.props
        this.props = answers;
    });
  }
  
 
 
  configuring() {
  }

  write()  {
    this.destinationProject = this.props.useDefaultConfiguration ? this.basePath +'/project-scratch-def.json' : this.basePath + '/scratch-org-def.json';
    
        // deleting any existing scratch org definition
        if (this.fs.exists(this.basePath + '/scratch-org-def.json'))  { 
            this.log('deleting ' + this.basePath + '/scratch-org-def.json');
            this.fs.delete(this.basePath + '/scratch-org-def.json');
        }
        if(!this.props.useDefaultConfiguration){
        // Start loading
        this.loading.start('Creating configuration scratch org definition file for...' + this.props.scratchOrgName +'\n');
    
        // Settings all features as String
        let features = this.props.orgFeatures.join("\",\"");
    
        this.fs.copyTpl(
            this.templatePath('config/scratch-org-def.json'),
            this.destinationProject,
            { orgName: this.props.scratchOrgName,
              orgFeatures: features,
              adminEmail: this.props.adminEmail,
              orgEdition: this.props.orgEdition,
              hasSampleData: this.props.hasSampleData,
              orgDescription: this.props.orgDescription,
              orgLocal: this.props.orgLocal,
              orgLanguage: this.props.orgLanguage
            }
        );
        
        if (this.fs.exists( this.destinationProject ))  { 
          this.loading.succeed(chalk.green('created successfully ' +  this.destinationProject));
        }
        else {
          this.loading.fail(chalk.red('Failed to create ' + this.destinationProject));
        }
      }
  }

  install() {
    if (this.fs.exists( this.destinationProject ))  { 
    this.loading.start(chalk.cyan("creating scratch org with alias ") + chalk.red(this.props.scratchOrgName) + '\n');

    const devhub = !this.options.devhubName ? this.props.devhubName : this.options.devhubName;

    // command builder
    let sfdxCommand = ' sfdx force:org:create';
        sfdxCommand += ' -d ' + this.props.numberOfDays; // --durationdays
        sfdxCommand += ' -a ' + this.props.scratchOrgName; // --setalias
        sfdxCommand += ' -f ' + this.basePath +'/scratch-org-def.json'; // --definitionfile
        sfdxCommand += ' -v ' + devhub; // -v | --targetdevhubusername

    if(this.props.isDefault)
      sfdxCommand += ' --setdefaultusername'; // -s | --setdefaultusername
      // running SFDX command
      this.log(" Run 🏄🏻‍ : "+ chalk.magenta(sfdxCommand) );
      let commandOutput = shell.exec( sfdxCommand , { silent: true } );
  
        if( commandOutput.code === 0 ){

            this.loading.succeed('😺 ' + chalk.greenBright('created successfully scratch org ') + this.props.scratchOrgName + '\n');
              // Generate User Password 
              this.log(chalk.cyan("Generate user password "));
              this.log(chalk.magenta('sfdx force:user:password:generate --targetusername ' + this.props.scratchOrgName) );
              
              if(shell.exec(' sfdx force:user:password:generate -u ' + this.props.scratchOrgName+ ' -v ' + devhub, { silent: true }).code === 0) {
                // Display User Details
                if(shell.exec(' sfdx force:user:display -u ' + this.props.scratchOrgName + ' -v ' + devhub).code === 0) {
                 
                // Finish by opening the org and say something nice
                  shell.exec(' say \' Your Scratch Org has been created \'');
                }
                
              }  
      }
      else {
        this.loading.fail(chalk.red('Failed to create scratch org'));
      }
    }
  }

  end() {
      // Open org
      this.log(( chalk.cyan("opening scratch org with alias " + this.props.scratchOrgName) ) );
      if(shell.exec(' sfdx force:org:open -u '+  this.props.scratchOrgName + ' -p lightning') === 0){
        shell.exit(1);
      }

    
     // this.composeWith(require.resolve('../app'));
  }
  
};
