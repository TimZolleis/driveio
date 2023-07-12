import type { DataFunctionArgs, V2_MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { checkIfUserSetupComplete, getUser } from '~/utils/user/user.server';
import { Outlet, useLoaderData } from '@remix-run/react';

export const meta: V2_MetaFunction = () => {
    return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await getUser(request);
    if (!user) {
        return redirect('/login');
    }

    const isSetupComplete = await checkIfUserSetupComplete(user);
    if (!isSetupComplete) {
        return redirect('/me/setup');
    }

    //Then we redirect based on the user's role
    if (user.role === 'STUDENT') {
        return redirect('/student');
    }
    //TODO: Create separate instructor page. For now we redirect to lesson overview
    if (user.role === 'INSTRUCTOR') {
        return redirect('/lessons');
    }

    return json({ user });
};

const Index = () => {
    const data = useLoaderData<typeof loader>();
    return (
        <>
            <h3 className={'font-semibold text-2xl'}>Hallo, {data.user?.firstName}!</h3>
            <Outlet />
        </>
    );
};
export default Index;
