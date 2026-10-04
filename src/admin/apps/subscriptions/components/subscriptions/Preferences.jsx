/**
 * DESCRIPTION: Preferences component for subscription settings
 * DESCRIPTION: Manages subscription appearance preferences like button color
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { Button, ColorPicker, HelpTip, TextInput, notify } from '@wpuf/components';
import { fetchSubscriptionSettings, saveSubscriptionSettings } from '../../api/subscription';

const Preferences = () => {
	const [buttonColor, setButtonColor] = useState('');
	const [isSaving, setIsSaving] = useState(false);


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

			notify(__('Preferences saved successfully', 'wp-user-frontend'), 'success');
		} catch (error) {
			console.error('[Preferences] Error saving settings:', error);
			notify(__('Failed to save settings', 'wp-user-frontend'), 'danger');
		} finally {
			setIsSaving(false);
		}
	}, [buttonColor]);

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
								<span className="ml-2"><HelpTip text={__('Custom color for subscription buttons. Leave empty to use the default primary color from theme.', 'wp-user-frontend')} /></span>
							</div>
							<div className="flex items-center gap-4">
								<div className="flex flex-col gap-2">
									<div className="flex items-center gap-2">
										<ColorPicker value={buttonColor} onChange={setButtonColor} />
										{/* develop: a text field too; empty = the default color */}
										<TextInput
											value={buttonColor}
											onChange={setButtonColor}
											placeholder={__('Default', 'wp-user-frontend')}
											className="w-32"
										/>
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
						<Button onClick={handleSave} busy={isSaving}>
							{isSaving ? __('Saving...', 'wp-user-frontend') : __('Save Preferences', 'wp-user-frontend')}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Preferences;
