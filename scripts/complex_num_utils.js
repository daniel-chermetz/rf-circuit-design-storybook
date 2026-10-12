globalThis.multiplyComplexNums = (n1_real, n1_imag, n2_real, n2_imag) => {
	return {
		real: n1_real * n2_real - n1_imag * n2_imag,
		imag: n1_real * n2_imag + n1_imag * n2_real
	}
}
globalThis.multiplyComplexNums_v2 = (n1, n2) => {
	return multiplyComplexNums(n1.real, n1.imag, n2.real, n2.imag);
}
globalThis.divideComplexNums = (n1_real, n1_imag, n2_real, n2_imag) => {
	const n1_theta = Math.atan2(n1_imag, n1_real);
	const n2_theta = Math.atan2(n2_imag, n2_real);

	const n1_magnitude = Math.sqrt(n1_real * n1_real + n1_imag * n1_imag);
	const n2_magnitude = Math.sqrt(n2_real * n2_real + n2_imag * n2_imag);

	const result_magnitude = n1_magnitude / n2_magnitude;
	const result_theta = n1_theta - n2_theta;

	const result_real = result_magnitude * Math.cos(result_theta);
	const result_imag = result_magnitude * Math.sin(result_theta);

	return {
		magnitude: result_magnitude,
		theta: result_theta,
		real: result_real,
		imag: result_imag
	}
}
globalThis.divideComplexNums_v2 = (n1, n2) => {
	return divideComplexNums(n1.real, n1.imag, n2.real, n2.imag);
}
globalThis.addComplexNums = (n1, n2) => {
	return {
		real: n1.real + n2.real,
		imag: n1.imag + n2.imag
	}
}
globalThis.subtractComplexNums = (n1, n2) => {
	return {
		real: n1.real - n2.real,
		imag: n1.imag - n2.imag
	}
}
globalThis.convert_complex_num_from_cartesian_to_polar = (real, imag) => {
	const magnitude = Math.sqrt(real * real + imag * imag);
	const theta = Math.atan2(imag, real);

	return {
		magnitude,
		theta
	}
}
globalThis.convert_complex_num_from_polar_to_cartesian = (magnitude, theta) => {
	return {
		real: magnitude * Math.cos(theta),
		imag: magnitude * Math.sin(theta)
	}
}
