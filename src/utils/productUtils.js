import { baseUrl } from '@/configs';

/**
 * Fetches all products by first getting the total count and then fetching all records.
 * This avoids using an arbitrarily large limit which can cause performance issues.
 * 
 * @param {string} token - Authorization token
 * @param {string} extraParams - Additional query parameters (e.g., "exported=1")
 * @returns {Promise<Array>} - Array of products
 */
export const fetchAllProducts = async (token, extraParams = "") => {
  const queryStr = extraParams ? `&${extraParams.replace(/^\?|^&/, '')}` : "";
  
  try {
    // Step 1: Fetch with limit 1 to get the total number of records
    const countResponse = await fetch(`${baseUrl}/nimda/master_product?limit=1${queryStr}`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    if (!countResponse.ok) {
      throw new Error(`Failed to fetch product count: ${countResponse.status}`);
    }

    const countResult = await countResponse.json();
    const totalData = countResult.totalData || countResult.totalPages * 1 || 10000;

    // Step 2: Fetch all records using the actual total count
    const productResponse = await fetch(`${baseUrl}/nimda/master_product?limit=${totalData}${queryStr}`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    if (!productResponse.ok) {
      throw new Error(`Failed to fetch all products: ${productResponse.status}`);
    }

    const productResult = await productResponse.json();
    return productResult.data || [];
  } catch (error) {
    console.error('Error in fetchAllProducts utility:', error);
    throw error;
  }
};
