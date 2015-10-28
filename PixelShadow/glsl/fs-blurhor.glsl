const int g_cKernelSize = 7;

float OffsetAndWeight[g_cKernelSize];
void initKernel()
{
	OffsetAndWeight[0] = 0.199471;
	OffsetAndWeight[1] = 0.176033;
	OffsetAndWeight[2] = 0.120985;
	OffsetAndWeight[3] = 0.064759;
	OffsetAndWeight[4] = 0.026995;
	OffsetAndWeight[5] = 0.008764;
	OffsetAndWeight[6] = 0.002216;
}

uniform sampler2D texture;
uniform float pixelSize;

uniform float minBlur;
uniform float maxBlur;

varying vec2 v_uv;

void main()
{
	initKernel();

	float dist = texture2D(texture, v_uv).b;

	float sum = texture2D(texture, v_uv).r * OffsetAndWeight[0];

	vec2 offset = vec2(0.0, 0.0);
	for(int i = 1; i < g_cKernelSize; i++)
	{
		offset.x = mix(minBlur, maxBlur, dist) * float(i) * pixelSize;

		sum += texture2D(texture, v_uv + offset).r * OffsetAndWeight[i];
		sum += texture2D(texture, v_uv - offset).r * OffsetAndWeight[i];
	}

	gl_FragColor = vec4(sum, 0.0, dist, 1.0);
}