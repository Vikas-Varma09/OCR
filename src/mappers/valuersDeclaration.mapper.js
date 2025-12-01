function mapValuersDeclaration(rawText) {
	return {
		valuerSignature: null,
		valuerName: null,
		onBehalfOf: null,
		telephone: null,
		fax: null,
		email: null,
		valuerQualifications: {
			mrics: null,
			frics: null,
			assocRics: null
		},
		ricsNumber: null,
		valuerAddress: null,
		valuerPostcode: null,
		reportDate: null
	};
}

module.exports = { mapValuersDeclaration };


