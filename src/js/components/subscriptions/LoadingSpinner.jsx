/**
 * DESCRIPTION: Loading spinner component for async operations
 * DESCRIPTION: Displays centered spinning loader for subscription data fetching
 */

/**
 * Loading spinner component
 *
 * @return {JSX.Element} Loading spinner element
 */
const LoadingSpinner = () => {
	return (
		<div className="flex h-svh items-center justify-center">
			<div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
		</div>
	);
};

export default LoadingSpinner;
