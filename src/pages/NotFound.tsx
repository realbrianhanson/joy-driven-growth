import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/hooks/use-auth";

const NotFound = () => {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-background px-5 py-6 sm:px-10">
      <Link to="/" aria-label="Happy Client home" className="self-start">
        <Logo />
      </Link>
      <main className="flex flex-1 items-center justify-center">
        <div className="max-w-md text-center">
          <p className="eyebrow text-gold-deep">Error 404</p>
          <h1 className="display mt-3 text-[3rem] text-foreground">This page does not exist</h1>
          <p className="mt-3 text-[0.9375rem] text-muted-foreground">The link may be old, or the address may have a typo.</p>
          <Button asChild size="lg" className="mt-8">
            <Link to={user ? "/dashboard" : "/"}>
              <ArrowLeft className="mr-1.5" /> {user ? "Back to your dashboard" : "Back to the home page"}
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
