import superheroes from 'superheroes'

var rand=Math.floor(Math.random() * superheroes.length);

var sname = superheroes[rand];

console.log(`My name is ${sname}`);