import Branch from "@/service/git/branch";

export default async () => {
  new Branch().main();
};
