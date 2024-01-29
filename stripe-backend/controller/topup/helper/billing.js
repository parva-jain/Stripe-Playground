function parseDetail(detail) {
  try {
    // Try parsing the detail string as JSON
    return JSON.parse(detail);
  } catch (error) {
    try {
      // If JSON parsing fails, try fixing the format and parsing again
      const fixedDetail = detail.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
      return JSON.parse(fixedDetail);
    } catch (error) {
      // If it still fails, return null or handle the error as appropriate
      console.error("Error parsing detail:", detail);
      return null;
    }
  }
}

const transformPlanData = (planData) => {
  const [
    index,
    totalNumOfDeduction,
    nextDeductionInNumOfBlocks,
    amount,
    isActive,
    detail,
  ] = planData;

  //   console.log(JSON.stringify(detail));

  return {
    index: parseInt(index),
    totalNumOfDeduction: parseInt(totalNumOfDeduction),
    nextDeductionInNumOfBlocks: parseInt(nextDeductionInNumOfBlocks),
    amount: parseInt(amount),
    isActive: isActive,
    detail: detail,
  };
};

exports.getPurchasablePlans = async () => {
  // const data = await LighthouseBillingContract.getActivePlanList()
  const data = [
    [
      0,
      1,
      1555200000,
      20000000,
      true,
      { planName: "Beacon", storageInGB: 5, bandwidthInGB: 10 },
    ],
    [
      1,
      1,
      1555200000,
      100000000,
      true,
      { planName: "Navigator", storageInGB: 25, bandwidthInGB: 50 },
    ],
    [
      2,
      1,
      1555200000,
      500000000,
      true,
      { planName: "Harbor", storageInGB: 150, bandwidthInGB: 300 },
    ],
    [
      5,
      150,
      14600000,
      99000000,
      true,
      { planName: "Lite", storageInGB: 150, bandwidthInGB: 200 },
    ],
    [
      6,
      150,
      14600000,
      499000000,
      true,
      { planName: "Premium", storageInGB: 1024, bandwidthInGB: 200 },
    ],
  ];
  return {
    activePurchasablePlans: data.map(transformPlanData),
  };
};
