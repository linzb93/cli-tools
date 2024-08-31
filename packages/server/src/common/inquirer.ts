import inquirer, { QuestionCollection } from "inquirer";
import spinner from "./spinner";

export default {
  async prompt(options: QuestionCollection) {
    if (spinner.isSpinning) {
      spinner.stop();
    }
    const answer = await inquirer.prompt(options);
    if (spinner.text !== "") {
      spinner.start();
    }
    return answer;
  },
};
