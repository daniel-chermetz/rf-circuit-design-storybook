globalThis.getTLWaveParams = (R, L, G, C, frequency) => {
	const omega = 2 * Math.PI * frequency;

	const gamma_squared_real = R * G - omega * omega * L * C;
	const gamma_squared_imag = omega * R * C + omega * L * G;

	const gamma_squared_length = Math.sqrt(gamma_squared_real * gamma_squared_real + gamma_squared_imag * gamma_squared_imag);
	const gamma_length = Math.sqrt(gamma_squared_length);

	const gamma_squared_theta = Math.atan2(gamma_squared_imag, gamma_squared_real);
	const gamma_theta = gamma_squared_theta / 2;

	console.log('gamma length: ', gamma_length);
	console.log('theta: ', gamma_theta * 180 / Math.PI);

	const alpha = gamma_length * Math.cos(gamma_theta); // gamma real
	const beta = gamma_length * Math.sin(gamma_theta); // gamma imag

	const z0_numerator_length = Math.sqrt(R * R + omega * L * omega * L);
	const z0_numerator_theta = Math.atan2(omega * L, R);

	const z0_magnitude = z0_numerator_length / gamma_length;
	const z0_theta = z0_numerator_theta - gamma_theta;

	const z0_real = z0_magnitude * Math.cos(z0_theta);
	const z0_imag = z0_magnitude * Math.sin(z0_theta);

	console.log('z0_real', z0_real);
	console.log('z0_imag', z0_imag);

	const phase_velocity_up = omega / beta;
	const phase_velocity_frac_of_c = phase_velocity_up / 3e8
	console.log('phase_velocity_frac_of_c: ', phase_velocity_frac_of_c);

	return {
		propagation_gamma_length: gamma_length,
		propagation_gamma_theta: gamma_theta,
		alpha,
		beta,
		phase_velocity_up,
		phase_velocity_frac_of_c,
		z0_magnitude,
		z0_theta,
		z0_real,
		z0_imag
	}
}