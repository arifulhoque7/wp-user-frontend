/**
 * DESCRIPTION: Preferences component for subscription settings
 * DESCRIPTION: Manages subscription appearance preferences like button color
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { fetchSubscriptionSettings, saveSubscriptionSettings } from '../../api/subscription';

const Preferences = () => {
	const [buttonColor, setButtonColor] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	const { addNotice } = useDispatch('wpuf/subscriptions-notice');

	// Load settings on mount
	useEffect(() => {
		const loadSettings = async () => {
			try {
				const response = await fetchSubscriptionSettings();

				if (response.button_color !== undefined) {
					setButtonColor(response.button_color || '');
				}
			} catch (error) {
				console.error('[Preferences] Error loading settings:', error);
			}
		};

		loadSettings();
	}, []);

	// Save settings
	const handleSave = useCallback(async () => {
		setIsSaving(true);

		try {
			const response = await saveSubscriptionSettings({
				button_color: buttonColor,
			});

			addNotice({
				content: __('Preferences saved successfully', 'wp-user-frontend'),
				type: 'success',
			});
		} catch (error) {
			console.error('[Preferences] Error saving settings:', error);
			addNotice({
				content: __('Failed to save settings', 'wp-user-frontend'),
				type: 'error',
			});
		} finally {
			setIsSaving(false);
		}
	}, [buttonColor, addNotice]);

	// Handle color input change from native color picker
	const handleColorInputChange = useCallback((e) => {
		setButtonColor(e.target.value);
	}, []);

	// Clear color
	const handleClearColor = useCallback(() => {
		setButtonColor('#079669');
	}, []);

	// Handle text input change
	const handleTextInputChange = useCallback((e) => {
		setButtonColor(e.target.value);
	}, []);

	return (
		<div className="p-10 max-w-4xl">
			<div className="mb-6">
				<h2 className="text-2xl font-semibold text-gray-900 mb-2">
					{__('Subscription Preferences', 'wp-user-frontend')}
				</h2>
				<p className="text-sm text-gray-600">
					{__('Configure subscription appearance preferences', 'wp-user-frontend')}
				</p>
			</div>

			<div>
				<div className="[&>:not([hidden])~:not([hidden])]:mt-6 [&>:not([hidden])~:not([hidden])]:mb-0">
					{/* Button Appearance Section */}
					<div>
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							{__('Color Settings', 'wp-user-frontend')}
						</h3>

						<div>
							<div className="flex items-center mb-1">
								<label className="text-sm font-medium text-gray-700">
									{__('Button Color', 'wp-user-frontend')}
								</label>
								<span
									className="wpuf-tooltip before:bg-gray-700 before:text-zinc-50 after:border-t-gray-700 after:border-x-transparent cursor-pointer ml-2 z-10"
									data-tip={__('Custom color for subscription buttons. Leave empty to use the default primary color from theme.', 'wp-user-frontend')}
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none">
										<path
											d="M9.833 12.333H9V9h-.833M9 5.667h.008M16.5 9a7.5 7.5 0 1 1-15 0 7.5 7.5 0 1 1 15 0z"
											stroke="#9CA3AF"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								</span>
							</div>
							<div className="flex items-center gap-4">
								<div className="flex flex-col gap-2">
									<div className="flex items-center gap-2">
										<input
											value={buttonColor}
											onChange={handleColorInputChange}
											type="color"
											className="w-12 h-10 rounded-md bg-transparent! border-0! cursor-pointer"
										/>
										<input
											value={buttonColor}
											onChange={handleTextInputChange}
											type="text"
											placeholder={__('Default', 'wp-user-frontend')}
											className="rounded-md border-gray-300 shadow-xs focus:border-primary focus:ring-primary text-sm w-32"
										/>
										{buttonColor && (
											<button
												type="button"
												onClick={handleClearColor}
												className="text-xs text-gray-500 hover:text-gray-700 underline"
											>
												{__('Clear', 'wp-user-frontend')}
											</button>
										)}
									</div>
								</div>
								<div className="ml-4 w-32">
									<button
										type="button"
										style={buttonColor ? { backgroundColor: buttonColor } : { backgroundColor: "#079669" }}
										onMouseOver={(e) => {
											if (buttonColor) {
												e.target.style.filter = 'brightness(0.9)';
											}
										}}
										onMouseOut={(e) => {
											if (buttonColor) {
												e.target.style.filter = 'brightness(1)';
											}
										}}
										className="wpuf-subscription-buy-btn block w-full rounded-md px-3 py-2 text-center text-sm font-semibold text-white shadow-xs ring-0 transition-all duration-200 leading-6"
									>
										{__('Buy Now', 'wp-user-frontend')}
									</button>
								</div>
							</div>
							<p className="text-xs text-gray-500 mt-2">
								{__('Leave empty to use the default primary color from your Tailwind configuration.', 'wp-user-frontend')}
							</p>
						</div>
					</div>

					{/* Save Button */}
					<div className="pt-6 flex justify-end">
						<button
							onClick={handleSave}
							disabled={isSaving}
							type="button"
							className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primaryHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
						>
							{isSaving ? __('Saving...', 'wp-user-frontend') : __('Save Preferences', 'wp-user-frontend')}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Preferences;
