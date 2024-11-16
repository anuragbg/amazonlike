// import superheroes from 'superheroes'
// var rand=Math.floor(Math.random() * superheroes.length);
// var sname = superheroes[rand];
// console.log(`My name is ${sname}`);
// *******************************************************************
import inquirer from 'inquirer';
import qr from 'qr-image'
import fs from 'fs';

inquirer
  .prompt([{
    message: "Type your URL: ",
    name: "URL",
  },
])
  .then((answers) => {
    const url=answers.URL;
    var qr_svg = qr.image(url);
    qr_svg.pipe(fs.createWriteStream('qr_image.png'));
  })
  .catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else went wrong
    }
  });
// **********************************************************************************************

