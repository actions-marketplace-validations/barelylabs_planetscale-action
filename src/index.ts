import { getInput, setOutput } from '@actions/core';

const inputName = getInput('name');

greet(inputName);

function greet(name: string) {
	return console.log(`Hello ${name}!`);
}
