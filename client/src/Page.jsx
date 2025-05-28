import { useState, useEffect } from "react";
import supabase from "../utils/supabase";

function Page() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    async function getTodos() {
      const { data: todos, error } = await supabase.from("todos").select();
      if (error) {
        console.error("Supabase error:", error);
        return;
      }
      if (todos && todos.length > 0) {
        setTodos(todos);
      }
    }
    getTodos();
  }, []);

  return (
    <div>
      {todos.map((todo) => (
        <li key={todo.id || todo}>{todo.title || JSON.stringify(todo)}</li>
      ))}
    </div>
  );
}
export default Page;
