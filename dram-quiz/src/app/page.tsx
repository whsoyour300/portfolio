import Quiz from "./Quiz";
import quiz from "@/data/quiz.json";

export default function Page() {
  return <Quiz quiz={quiz} />;
}
