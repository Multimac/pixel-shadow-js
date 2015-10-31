uniform sampler2D texture;
uniform float pixelSize;

varying vec2 v_uv;

void main()
{
	vec2 colorA = texture2D(texture, v_uv - vec2(pixelSize * 3.5, 0.0)).rg;
	vec2 colorB = texture2D(texture, v_uv - vec2(pixelSize * 2.5, 0.0)).rg;
	vec2 colorC = texture2D(texture, v_uv - vec2(pixelSize * 1.5, 0.0)).rg;
	vec2 colorD = texture2D(texture, v_uv - vec2(pixelSize * 0.5, 0.0)).rg;
	vec2 colorE = texture2D(texture, v_uv + vec2(pixelSize * 0.5, 0.0)).rg;
	vec2 colorF = texture2D(texture, v_uv + vec2(pixelSize * 1.5, 0.0)).rg;
	vec2 colorG = texture2D(texture, v_uv + vec2(pixelSize * 2.5, 0.0)).rg;
	vec2 colorH = texture2D(texture, v_uv + vec2(pixelSize * 3.5, 0.0)).rg;

	gl_FragColor = vec4(min(
		min(
			min(colorA, colorB),
			min(colorC, colorD)
		),
		min(
			min(colorE, colorF),
			min(colorG, colorH)
		)
	), 0.0, 1.0);
}