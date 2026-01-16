import { Outlet } from "react-router-dom";
import Header from "./header/Header";

export default function DefaultLayout() {
  return (
    <>
      <Header></Header>
      <main>
        <Outlet></Outlet>
      </main>
    </>
  );
}
