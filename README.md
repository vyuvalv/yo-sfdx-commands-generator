## SFDX with YO Command 

**LOCAL YEOMAN GENERATOR**  
`generator-dx >> yo dx`
***************************************

> * **Salesforce DX Generator**  
    - This is a base Yeoman generator that can give some ideas of how to leverage yeoman with sfdx commands.  
    - Yeoman Workflow will create an SFDX Project and allow to add some other configurations and org options like Create,Connect,Delete.  
    - Simply Type  `yo dx`  and yeoman will walk you through creating your SFDX project with style.  
    - Additional support to create readme.md and ignore files.  
 

***************************************

## Installation

Few simple steps, install [Yeoman](http://yeoman.io) (we assume you have pre-installed [node.js](https://nodejs.org/) and [sfdx cli](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_cli.htm) ).  


1. Install SFDX
```npm
   npm install sfdx-cli --global
```
2. Install Yo
```npm
   npm install -g yo
```

3. Clone this repository

4. Rename the git folder to `generator-dx` and step inside it
```npm
  cd generator-dx
```
5. Link required npm modules  
```npm
  npm link
```


Then call your new workflow generator with:

```bash
  yo dx
```


 Feel Free to build your own Generator using the generator for generators  
 `npm install -g yo generator-generator`

***************************************
## Workflow Overview

* In case your Devhub is not connect will show alert and you will bneed to connect DevHub

### Generator Paths
* `yo dx` - will show the main menu
* `yo dx:project` - will create a SFDX project in current folder
* `yo dx:org` - will configure features and create a new scratch org
* `yo dx:manage` - will allow to Open, Delete, Connect and Configure Default Settings
* `yo dx:connect` - will allow to connect to DevHub, Production or Sandbox

>### Demo
```
✔ Pulled defaults successfully

     _-----_     ╭──────────────────────────╮
    |       |    │       Welcome to DX      │
    |--(o)--|    │    Connected Orgs : 2    │
   `---------´   │  Active Scratch Orgs : 2 │
    ( _´U`_ )    │                          │
    /___A___\   /│  Default DevHub : DevHub │
     |  ~  |     │   Default Scratch : DEV  │
   __'.___.'__   ╰──────────────────────────╯
 ´   `  |° ´ Y `
```

>? What would you like to do ? (Press `<space>` to select, `<a>` to toggle all, `<i>` to invert selection)  
    -˯-˯-˯-˯-˯-˯-˯  
  ❯ ◯ New Project  
    ◯ New Scratch Org  
    ◯ Manage DX  
    ◯ Open Project Folder  
    -^-^-^-^-^-^-^  
    ◯ Exit  
  
_______________________________________


### Workflow Questions

<details>
<summary>
  <b> New Project - Create SFDX Project </b>
</summary>

>? Project Name ? (ROOT) /  
>? App Folder Name ?  (force-app)  
>? Namespace (optional)  
>? Include Manifest file (y/N)  
>? Include ReadMe file (y/N)  
>? Description (optional) Press `<enter>` to launch your preferred editor. 

* vim Instruction :
> * Type `a` to start typing
> * type `esc` key and then `:wq` to exit


```
🙈  configuring sfdx project options for : MyProject
 Run 🏄🏻‍ :  sfdx force:project:create -n `<ProjectName>` -p `<AppFolder>` -t standard
 ✔ Created project successfully
   create MyProject/config/scratch-org-def.json
   create MyProject/.forceignore
   create MyProject/.gitignore
 Your project is ready! - Launch VS Code
```
</details>
<details>
<summary>
  <b> New Scratch Org </b>
</summary>

>? Your Scratch Org name  
>? Admin Email (myemail@gmail.com)  
>? Add Sample Data (y/N)  
>? Number of days (30)  
>? Org Description  
>? Set as default org (Y/n)  

>? Choose Edition: (Use arrow keys)  
  ❯ Developer  
    Enterprise  
    Group  
    Professional  

>? Choose Country: (Use arrow keys)  
  ❯ United States  
    Israel  
    France  
    Australia  

>? Choose Language: (Use arrow keys)  
  ❯ English  
    Hebrew  
    French  

>? Which features would you like to enable? (Press `<space>` to select, `<a>` to toggle all, `<i>` to invert selection)  
  ❯ ◉ Communities  
    ◉ PersonAccounts  
    ◯ AuthorApex  
    ◯ MultiCurrency  
    ◯ ServiceCloud  
    ◯ ContactsToMultipleAccounts  

```
✔ created successfully scratch-org-def.json
   create sfdx_logs/scratch-org-def.json
⠋ creating scratch org with alias `<OrgAlias>`
```

</details>


> <i> HINT : Select Both New Project + New Scratch Org to Automate the process ... </i>

<details>
<summary>
  <b> Manage DX - Org Commands </b>
</summary>

> **? Select Option : (Use arrow keys)**    
  ❯ Open Org  
    Delete Scratch Org  
    Connect Org  
    Configure Defaults  

   **:::: Open Org / Delete Org ::::**  
> **? Select Existing Scratch org : (Use arrow keys)**    
    - Dynamic Org list  

  **:::: Configure Defaults ::::**     
> **? Change Defaults for : (Use arrow keys)**     
  ❯ DevHub  
    Scratch Org  
   - Dynamic Devhub and Scratch Org list 
</details>

## SFDX Commands in use 

* `sfdx force:project:create`
* `sfdx force:auth:web:login`
* `sfdx force:org:create`
* `sfdx force:user:password:generate`
* `sfdx force:user:display`
* `sfdx force:org:open`
* `sfdx force:config:set`
* `sfdx force:org:delete`


## Getting To Know Yeoman

 * Yeoman has a heart of gold.
 * Yeoman is a person with feelings and opinions, but is very easy to work with.
 * Yeoman can be too opinionated at times but is easily convinced not to be.
 * Feel free to [learn more about Yeoman](http://yeoman.io/).



## Dependencies in Use
<details>
<summary><a href="https://github.com/yeoman/yosay" target="_blank"> yosay </a>  - Tell Yo to Say Hello
</summary>
<pre>
    details:
      - description: yosay will tell yo what to say using yeoman ASCII image
        sample:  this.log( yosay( 'Hello World' );
</pre>
</details>

<details>
<summary> 
    <a href="https://github.com/chalk/chalk" target="_blank"> chalk.js </a> - Give some colour
</summary>
<pre>
    details:
      - description: Will allow to add colours to the input/output
        sample:  this.log( chalk.redBright.underline('Hello World') );
</pre>
</details>


<details>
<summary> 
    <a href="https://github.com/shelljs/shelljs" target="_blank"> shelljs </a> -  Unix shell commands on top of the Node.js API
</summary>
<pre>
    details:
      - description: Will allow to run shell commands
        examples:  
        // get the output of the command silently 
        - shell.exec(' sfdx force:org:list --json', { silent: true } ).stdout; 
        // get list of directories in folder
        -  const folders = shell.ls('-L',this.destinationPath() );

        - <a href="https://devhints.io/shelljs" target="_blank"> shelljs </a> - cheat sheet
</pre>
</details>

<details>
<summary> 
    <a href="https://github.com/sindresorhus/ora" target="_blank"> ora </a> - Elegant terminal spinner
</summary>
<pre>
    details:
      - description: Will allow to show a spinner for running process
      require : 
        - const spinner = require('ora');
      sample: 
      // Start loading spinner
      this.loading = new spinner(
        { spinner:'dots',
          color : 'yellow' }
      ).start('Start Spinning...');
      // Success 
      - this.loading.succeed('Successfully loaded');
      // Failure 
      - this.loading.fail('Failed to load');
</pre>
</details>

<details>
<summary> 
    <a href="https://github.com/SBoudrias/Inquirer.js" target="_blank"> Inquirer.js </a> - Dynamic questions and validation of prompt questions
</summary>
<pre>
    details:
      - description: Will allow to add logic to questions
        sample: 
        const questions = [{
        type: 'checkbox',
        name: 'mainMenu',
        message: 'What would you like to do ?',
        validate: function(choices) {
          return choices.length > 0 ? true : chalk.redBright('Must Select at least one option');
        },
        choices: [
          {
            type: 'separator', 
            line:'-˯-˯-˯-˯-˯-˯-˯'
          },
          {
            name:  'New Project',
            value: 'create-project' ,
            checked: false
          },
          {
            name:  'New Scratch Org',
            value:  'create-org',
            checked: false
          },
          {
            type: 'separator', 
            line: '-^-^-^-^-^-^-^'
          }
        ]
      },
      {
        type: "input",
        name: "inputName",
        message: "Please give a name to your project : "),
        default:'Yuval',
        when: function(answers) {
          return answers.mainMenu.includes("create-project");
        },
        validate: function(value) {
          return value ? true : 'Please enter a name';
        }
      }
      ];
</pre>
</details>


<details>
<summary> 
    <a href="https://github.com/SBoudrias/mem-fs-editor" target="_blank"> mem-fs-editor </a> - helpers working on top of mem-fs
</summary>
<pre>
    details:
      - description: Will allow to access file system
        sample: 
        // read file as Json object
        - this.fs.readJSON('filePath');
        // check if file path exists
        - this.fs.exists('filePath');
        // delete file
        - this.fs.delete('filePath');
</pre>
</details>


