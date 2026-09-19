import unittest

from api import bank_gemini_dict_to_plaintext


class BankSummaryParsingTests(unittest.TestCase):
    def test_formats_indian_currency_strings_without_returning_na(self):
        sample = {
            "person_entity": "Amit Sharma",
            "statement_period": "01 Jan 2025 - 31 Mar 2025",
            "opening_balance": "₹1,00,000.00",
            "total_credits": "₹2,50,000.00",
            "total_debits": "₹1,80,000.00",
            "closing_balance": "₹1,70,000.00",
            "estimated_annual_income": "₹4,00,000.00",
            "estimated_tax_new_regime_fy_2025_26": "₹12,500.00",
        }

        text = bank_gemini_dict_to_plaintext(sample)

        self.assertIn("₹1,00,000.00", text)
        self.assertIn("₹2,50,000.00", text)
        self.assertNotIn("N/A", text)


if __name__ == "__main__":
    unittest.main()
