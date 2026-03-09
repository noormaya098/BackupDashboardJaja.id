import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BuildOutlined,
  ArrowLeftOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { baseUrl } from '@/configs';

const CompanyDetail = () => {
  const { id_company } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyDetail = async () => {
      try {
        const response = await axios.get(`${baseUrl}/nimda/company/get-company-detail`, {
          params: { id_company }
        });

        setCompany(response.data.data);
      } catch (error) {
        console.error('Error fetching company detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetail();
  }, [id_company]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="animate-pulse w-16 h-16 bg-gray-300 rounded-full"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-gray-100 shadow-md rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-500">
            Data perusahaan tidak ditemukan
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6 flex items-center space-x-4">
            <button
              onClick={() => navigate('/companies')}
              className="hover:bg-blue-700 p-2 rounded-full transition-colors"
            >
              <ArrowLeftOutlined className="text-2xl" />
            </button>
            <h1 className="text-2xl font-bold flex items-center space-x-3">
              <BuildOutlined />
              <span>Detail Perusahaan</span>
            </h1>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
            {/* Company Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                {company.company_name}
              </h2>

              <div className="space-y-4">
                <div className="flex space-x-3">
                  <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {company.company_code}
                  </span>
                  <span className={`
                    px-3 py-1 rounded-full text-sm 
                    ${company.is_erlangga
                      ? 'bg-green-50 text-green-800'
                      : 'bg-gray-50 text-gray-800'
                    }`}
                  >
                    {company.is_erlangga
                      ? 'Perusahaan Erlangga'
                      : 'Non-Erlangga'}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Alamat</h3>
                  <p className="text-gray-600">
                    {company.billing_address || 'Tidak ada alamat'}
                  </p>
                </div>

                {company.tax_number && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">NPWP</h3>
                    <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                      {company.tax_number}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Person */}
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-6 pb-3 border-b border-gray-200 flex items-center space-x-3">
                <UserOutlined className="text-blue-600" />
                <span>Penanggung Jawab</span>
              </h3>

              {company.pic_company && (company.pic_company.name || company.pic_company.phone || company.pic_company.email) ? (
                <div className="space-y-4">
                  {company.pic_company.name && (
                    <div className="flex items-center space-x-3">
                      <UserOutlined className="text-blue-600" />
                      <span>{company.pic_company.name}</span>
                    </div>
                  )}

                  {company.pic_company.phone && (
                    <div className="flex items-center space-x-3">
                      <PhoneOutlined className="text-green-600" />
                      <span>{company.pic_company.phone}</span>
                    </div>
                  )}

                  {company.pic_company.email && (
                    <div className="flex items-center space-x-3">
                      <MailOutlined className="text-red-600" />
                      <span>{company.pic_company.email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                  Tidak ada informasi kontak
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;