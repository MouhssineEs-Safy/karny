import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../store/AuthContext";

export default function Index() {
  const { isAuthenticated } = useAuth();
  return <Redirect href={isAuthenticated ? "/home" : "/login"} />;
}
