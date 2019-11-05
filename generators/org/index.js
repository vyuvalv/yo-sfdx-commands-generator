const Generator = require('yeoman-generator');
const shell = require('shelljs');
const chalk = require('chalk');
const spinner = require('ora');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument("devhubName", { type: String, required: false });
    this.argument("projectPath", { type: String, required: false });
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
          default: 'myemail@gmail.com',
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
    ];
    // optional questions options coming from templates
    const aditionalQuestions =[
      {
        type: 'list',
        name: 'orgEdition',
        message: 'Choose Edition:',
        choices: orgOptionsChoices.orgEdition
      },    
      {
        type: 'list',
        name: 'orgLocal',
        message: 'Choose Country:',  
        default: 'US',
        choices: orgOptionsChoices.orgLocal
      }, 
      {
        type: 'list',
        name: 'orgLanguage',
        message: 'Choose Language:',  
        default: 'en_US',
        choices: orgOptionsChoices.orgLanguage
      },
      {
        type: 'checkbox',
        name: 'orgFeatures',
        message: 'Which features would you like to enable?',
        validate: function(value) {
          return value ? true : 'Please enter at least one selection';
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
        // deleting any existing scratch org definition
        if (this.fs.exists(this.basePath + '/scratch-org-def.json'))  { 
            this.log('deleting ' + this.basePath + '/scratch-org-def.json');
            this.fs.delete(this.basePath + '/scratch-org-def.json');
        }
        // Start loading
        this.loading.start('Creating configuration scratch org definition file for...' + this.props.scratchOrgName +'\n');
    
        // Settings all features as String
        let features = this.props.orgFeatures.join("\",\"");
    
        this.fs.copyTpl(
            this.templatePath('config/scratch-org-def.json'),
            this.destinationPath( this.basePath +'/scratch-org-def.json'),
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
        
        if (this.fs.exists(this.basePath + '/scratch-org-def.json'))  { 
          this.loading.succeed(chalk.green('created successfully scratch-org-def.json '));
        }
        else {
          this.loading.fail(chalk.red('Failed to create scratch-org-def.json'));
        }
  }

  install() {

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
      if(shell.exec(sfdxCommand).code === 0) {
            this.loading.succeed('😺 ' + chalk.greenBright('created successfully scratch org ') + this.props.scratchOrgName + '\n');
              // Generate User Password 
              this.log(chalk.cyan("Generate user password "));
              this.log(chalk.magenta('sfdx force:user:password:generate --targetusername ' + this.props.scratchOrgName) );
              
              if(shell.exec(' sfdx force:user:password:generate -u ' + this.props.scratchOrgName+ ' -v ' + devhub, { silent: true }).code === 0) {
                // Display User Details
                shell.exec(' sfdx force:user:display -u ' + this.props.scratchOrgName + ' -v ' + devhub);
              }  
      }
      else {
        this.loading.fail(chalk.red('Failed to create scratch org'));
      }
  }

  end() {
      // Finish by opening the org and say something nice
      shell.exec(' say \' Your Scratch Org has been created \'');
      // Open org
      this.log(( chalk.cyan("opening scratch org with alias " + this.props.scratchOrgName) ) );
      shell.exec(' sfdx force:org:open -u '+  this.props.scratchOrgName);

       // cleanup
      if ( shell.test('-e', this.destinationPath()+'/sfdx_logs' ) )  { 
        this.log(chalk.red('-- cleanup ') + this.destinationPath()+'/sfdx_logs');
        shell.rm('-rf',this.destinationPath()+'/sfdx_logs');
      }
      shell.exit(1);
     // this.composeWith(require.resolve('../app'));
  }
  
};
