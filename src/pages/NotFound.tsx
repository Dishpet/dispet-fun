import { useLocation } from "react-router-dom";
import { useEffect } from "react";

import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <PageHero title="404" />
      <div className="bg-background py-20">
        <div className="container px-4 text-center">
          <h1 className="mb-4 text-4xl font-heading">Ups! Stranica nije pronađena</h1>
          <p className="mb-8 text-xl text-muted-foreground">Stranica koju tražite ne postoji.</p>
          <Button asChild variant="default" size="lg">
            <a href="/">Povratak na Početnu</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
