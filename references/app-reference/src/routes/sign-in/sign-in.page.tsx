import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { safeReturnTo } from "~/lib/session/sign-in-redirect";
import { sessionService } from "~/services";

export function SignInPage() {
	const [search] = useSearchParams();
	const signIn = useMutation({
		mutationFn: sessionService.signIn,
		// A page load, so the app starts clean for whoever just signed in.
		onSuccess: () => window.location.assign(safeReturnTo(search.get("returnTo"))),
	});
	function submit(form: FormData) {
		signIn.mutate({
			email: String(form.get("email")),
			password: String(form.get("password")),
		});
	}
	return (
		<main>
			<title>Sign in</title>
			<h1>Sign in</h1>
			<form action={submit}>
				<label>
					Email <input autoComplete="username" name="email" required type="email" />
				</label>
				<label>
					Password{" "}
					<input autoComplete="current-password" name="password" required type="password" />
				</label>
				<button disabled={signIn.isPending} type="submit">
					Sign in
				</button>
				{signIn.isError ? <p role="alert">That didn't work. Check both and try again.</p> : null}
			</form>
		</main>
	);
}
