globalThis.getInductorReactanceByFrequency = (inductance, frequency) => {
	return (2 * Math.PI * frequency * inductance);
}

globalThis.getCapacitorReactanceByFrequency = (capacitor, frequency) => {
	return 1 / (2 * Math.PI * frequency * capacitor);
}

globalThis.get_impedance_for_RLC_value = (RLC, frequency) => {
	let reactance = 0;
	if (RLC.inductor) {
		reactance += getInductorReactanceByFrequency(RLC.inductor, frequency);
	}
	if (RLC.capacitor) {
		reactance -= getCapacitorReactanceByFrequency(RLC.capacitor, frequency);		
	}

	return {
		real: RLC.resistor ? RLC.resistor : 0,
		imag: reactance
	}
}

globalThis.getRLCValsForImpedance = (impedance, frequency) => {
	const resistor = impedance.real;
	let capacitor = 0;
	let inductor = 0;
	if (Math.abs(impedance.imag) > 1e-4) {
		if (impedance.imag > 0) {
			inductor = impedance.imag / (2 * Math.PI * frequency);
		}
		if (impedance.imag < 0) {
			capacitor = 1 / (-2 * Math.PI * frequency * impedance.imag)
		}
	}
	return {
		resistor,
		capacitor,
		inductor
	}
}

globalThis.get_generator_and_load_thevenin_circuit_components = (generator, load, frequency, z0_magnitude, beta) => {
	const relfection_load = getTLRefelectionCoefficient(load.real, load.imag, z0_magnitude, 0).reflection;
	const thevenin_equivalent = find_thevenin_equivalent_circuit(generator, relfection_load, z0_magnitude, beta);
	
	const tl1_and_generator_equivalent = thevenin_equivalent.tl1_and_generator_equivalent;
	const tl2_and_load_equivalent = thevenin_equivalent.tl2_and_load_equivalent;
	// console.log('tl2_and_load_equivalent', tl2_and_load_equivalent);

	const source_RLC = getRLCValsForImpedance({
		real: tl1_and_generator_equivalent.z_real,
		imag: tl1_and_generator_equivalent.z_imag,
	}, frequency);
	const load_RLC = getRLCValsForImpedance({
		real: tl2_and_load_equivalent.z_real,
		imag: tl2_and_load_equivalent.z_imag,		
	}, frequency);

	// console.log('source_RLC', source_RLC);
	// console.log('load_RLC', load_RLC);

	const source_voltage = {
		real: tl1_and_generator_equivalent.voltage_real,
		imag: tl1_and_generator_equivalent.voltage_imag,
		...convert_complex_num_from_cartesian_to_polar(tl1_and_generator_equivalent.voltage_real, tl1_and_generator_equivalent.voltage_imag)
	}
	source_voltage.theta_degrees = source_voltage.theta * 180 / Math.PI;
	// console.log(source_voltage);
}

globalThis.find_LC_components_to_obtain_target_impedance = (target_impedance, fixed_resistor, frequency) => {
	const R_squared = fixed_resistor * fixed_resistor;
	const denominator = (target_impedance.real * target_impedance.real + target_impedance.imag * target_impedance.imag);
	const G = target_impedance.real / denominator;
	const B = -target_impedance.imag / denominator;

	const matching_components = [];

	let x1 = 0;
	let x2 = 0;

	// G * R^2 + G * x1^2 = R
	// x1^2 = (R - G * R^2) / G
	let sqrtArg = (fixed_resistor - G * R_squared) / G;

	if (sqrtArg < 0) {
		x1 = 0;
		x2 = -1 / B;
	} else {
		x1 = Math.sqrt(sqrtArg);
		x2 = 1 / (-B - x1 / (R_squared + x1 * x1));
	}

	let matching_reactive_comp_1 = getRLCValsForImpedance({real: 0, imag: x1}, frequency);
	let matching_reactive_comp_2 = getRLCValsForImpedance({real: 0, imag: x2}, frequency);

	matching_components.push({
		reactance_1: x1,
		matching_reactive_comp_1,
		reactance_2: x2,
		matching_reactive_comp_2,
		note: 'x1 in series with generator / load impedance and x2 in parallel after (generator case) or before (load case)',
		...(sqrtArg < 0 ? {note_2: 'approximate solution as not real solution available', error: true} : {})		
	});

	if (sqrtArg > 0) {
		x1 = -x1;
		x2 = 1 / (-B - x1 / (R_squared + x1 * x1));

		matching_reactive_comp_1 = getRLCValsForImpedance({real: 0, imag: x1}, frequency);
		matching_reactive_comp_2 = getRLCValsForImpedance({real: 0, imag: x2}, frequency);

		matching_components.push({
			reactance_1: x1,
			matching_reactive_comp_1,
			reactance_2: x2,
			matching_reactive_comp_2,
			note: 'x1 in series with generator / load impedance and x2 in parallel after (generator case) or before (load case)'
		});
	}

	return matching_components;
}

globalThis.find_series_parallel_LC_components_to_obtain_target_impedance_V2 = (target_impedance, fixed_impedance, frequency) => {
	// L network with first (right after the fixed Zsource) the series component and then the parallel one

	/* 
		series impedance: Rs + j * Xs
	 	parallel impedance: j * Xp
		both are in parallel looking from the port towards the generator
		Admittance of parallel branches is a sum: Y = 1 / (Rs + j * Xs) + 1 / (j * Xp)
		It can be shown that (can be verified numerically for one thing):
		1 / (Rs + j * Xs) = (Rs - j * Xs) / (Rs^2 + Xs^2)
		and
		1 / (j * Xp) = -j / Xp (because 1 / j = -j)
		Thus Yt:
		Yt = Rs / (Rs^2 + Xs^2) - j * (Xs / (Rs^2 + Xs^2) + 1 / Xp)
		
		// The only unknowns are Xs and Xp
		G = Rs / (Rs^2 + Xs^2)
		
		// Solving for Xs:
		G * (Rs^2 + Xs^2) = Rs
		G * Xs^2 = Rs - G * Rs^2
		
		Xs^2 = (Rs - G * Rs^2) / G,
		Xs = +/- sqrt((Rs - G * Rs^2) / G)
		Xs = fixed_impedance.imag + seriesImpedance.imag
		seriesImpedance.imag = Xs - fixed_impedance.imag

		Now G is the real part of the target admittance ((1 / target_impedance).real),
		And once more it can be shown that 1 / (Rtarget + j * Xtarget) = (Rtarget - j * Xtarget) / (Rtarget^2 + Xtarget^2),
		Leaving the real part as: Rtarget / (Rtarget^2 + Xtarget^2)

		// Solving for Xp:
		-(Xs / (Rs^2 + Xs^2) + 1 / Xp) = B (the imag part of the target admittance) = -Xtarget / (Rtarget^2 + Xtarget^2)
		-1/Xp = -Xtarget / (Rtarget^2 + Xtarget^2) + Xs / (Rs^2 + Xs^2)
		Xp = -1 * (1 / (-Xtarget / (Rtarget^2 + Xtarget^2) + Xs / (Rs^2 + Xs^2)))
	*/

	const R_squared = fixed_impedance.real * fixed_impedance.real;
	const denominator = (target_impedance.real * target_impedance.real + target_impedance.imag * target_impedance.imag);
	const G = target_impedance.real / denominator;
	const B = -target_impedance.imag / denominator;

	const matching_components = [];

	let x1 = 0;
	let x2 = 0;

	let sqrtArg = (fixed_impedance.real - G * R_squared) / G;
	// console.log('sqrtArg', sqrtArg);

	if (sqrtArg < 0) {
		x1 = 0;
		x2 = -1 / B;
	} else {
		x1 = Math.sqrt(sqrtArg);
		x2 = 1 / (-B - x1 / (R_squared + x1 * x1));
	}

	let matching_reactive_comp_1 = getRLCValsForImpedance({real: 0, imag: (x1 - fixed_impedance.imag)}, frequency);
	let matching_reactive_comp_2 = getRLCValsForImpedance({real: 0, imag: x2}, frequency);

	matching_components.push({
		reactance_1: x1 - fixed_impedance.imag,
		matching_reactive_comp_1,
		reactance_2: x2,
		matching_reactive_comp_2,
		note: 'x1 in series with generator / load impedance and x2 in parallel after (generator case) or before (load case)',
		...(sqrtArg < 0 ? {note_2: 'approximate solution as not real solution available', error: true} : {})
	});

	if (sqrtArg > 0) {
		x1 = -x1;
		x2 = 1 / (-B - x1 / (R_squared + x1 * x1));

		matching_reactive_comp_1 = getRLCValsForImpedance({real: 0, imag: (x1 - fixed_impedance.imag)}, frequency);
		matching_reactive_comp_2 = getRLCValsForImpedance({real: 0, imag: x2}, frequency);

		matching_components.push({
			reactance_1: x1 - fixed_impedance.imag,
			matching_reactive_comp_1,
			reactance_2: x2,
			matching_reactive_comp_2,
			note: 'x1 in series with generator / load impedance and x2 in parallel after (generator case) or before (load case)'
		});
	}

	return matching_components;
}

globalThis.find_parallel_series_LC_components_to_obtain_target_impedance = (target_impedance, fixed_impedance, frequency) => {
	// L network with first (right after the fixed Zsource) the parallel component and then the series one
	// This is also a T network if we add a chosen impedance in series with the fixed impedance

	/* 
		fixed series impedance: Rfixed + j * Xfixed
	 	parallel impedance: j * Xp
		series impedance: j * Xs

		Yfixed_and_parallel = 1 / (Rfixed + j * Xfixed) + 1 / (j * Xp)
		Yfixed_and_parallel = Rfixed / (Rfixed^2 + Xfixed^2) - j * (Xfixed / (Rfixed^2 + Xfixed^2) + 1 / Xp)
		
		Rfixed / (Rfixed^2 + Xfixed^2) = Gtarget = Rtarget / (Rtarget^2 + Xtarget^2)

		But then I'm not allowed to have any variable to control G at this point

		We conclude:
		In general: Gfixed_parallel != Gtarget
		and Xp cannot change Gfixed_parallel, because its admittance is purely imaginary.

		That's OK: because Yfixed_and_parallel || -j/Xs would let us control real part of G.
		Should we then (Yfixed_and_parallel * (-j/Xs)) / (Yfixed_and_parallel -j/Xs)
		
		This seems like a lot of work, so let's try a different path

		Instead we can continue by converting Yfixed_and_parallel to impedance:
		Zfixed_and_parallel = 1 / Yfixed_and_parallel

		It can be shown (and can be verified numerically):
		Z = G / (G^2 + B^2) - j * B / (G^2 + B^2)

		Zfixed_and_parallel.real = (Rfixed / (Rfixed^2 + Xfixed^2)) / ((Rfixed / (Rfixed^2 + Xfixed^2))^2 + (Xfixed / (Rfixed^2 + Xfixed^2) + 1 / Xp)^2)

		G = Rfixed / (Rfixed^2 + Xfixed^2)
		Define partB as: Xfixed / (Rfixed^2 + Xfixed^2)

		G / (G^2 + partB^2 + 2 * partB / Xp + 1 / Xp^2) = target_impedance.real
		G = (G^2 + partB^2 + 2 * partB / Xp + 1 / Xp^2) * target_impedance.real
		G - target_impedance.real * G^2 - partB^2 * target_impedance.real = 2 * partB * target_impedance.real / Xp + target_impedance.real / Xp^2
		(G - target_impedance.real * G^2 - partB^2 * target_impedance.real) * Xp^2 - 2 * partB * target_impedance.real * Xp - target_impedance.real = 0

		This is a quadric equation of the form:
		a * Xp^2 + b * Xp + c = 0
		with a, b, c known real numbers

		Xp = (-b +/- sqrt(b^2 - 4ac))/2a
		
		Then with Xp known is the reactance: -B / (G^2 + B^2)
		-B / (G^2 + B^2) + Xs = target_impedance.imag
	*/

	const R_squared = fixed_impedance.real * fixed_impedance.real;
	const X_squared = fixed_impedance.imag * fixed_impedance.imag;

	const G = fixed_impedance.real / (R_squared + X_squared);
	const part_of_B = fixed_impedance.imag / (R_squared + X_squared);

	const a = G - target_impedance.real * G * G - part_of_B * part_of_B * target_impedance.real;
	const b = -2 * part_of_B * target_impedance.real;
	const c = -target_impedance.real;

	if ((b * b - 4 * a * c) < 0) {
		return [{
			note: 'no solution with negative discriminant',
			error: true
		}];
	}

	const Xp_1 = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
	const B_1 = -(fixed_impedance.imag / (R_squared + X_squared) + 1 / Xp_1);
	const Xs_1 = target_impedance.imag + B_1 / (G * G + B_1 * B_1);

	const Xp_2 = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
	const B_2 = -(fixed_impedance.imag / (R_squared + X_squared) + 1 / Xp_2);
	const Xs_2 = target_impedance.imag + B_2 / (G * G + B_2 * B_2);	

	const matching_components = [];

	let matching_reactive_comp_1 = getRLCValsForImpedance({real: 0, imag: Xp_1}, frequency);
	let matching_reactive_comp_2 = getRLCValsForImpedance({real: 0, imag: Xs_1}, frequency);

	matching_components.push({
		reactance_1: Xp_1,
		matching_reactive_comp_1,
		reactance_2: Xs_1,
		matching_reactive_comp_2,
		note: 'x1 in parallel with generator / load impedance and x2 in series after (generator case) or before (load case)'
	});

	matching_reactive_comp_1 = getRLCValsForImpedance({real: 0, imag: Xp_2}, frequency);
	matching_reactive_comp_2 = getRLCValsForImpedance({real: 0, imag: Xs_2}, frequency);

	matching_components.push({
		reactance_1: Xp_2,
		matching_reactive_comp_1,
		reactance_2: Xs_2,
		matching_reactive_comp_2,
		note: 'x1 in parallel with generator / load impedance and x2 in series after (generator case) or before (load case)'
	});

	return matching_components;
}
