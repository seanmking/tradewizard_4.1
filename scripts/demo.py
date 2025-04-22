import argparse
import logging
import os
import sys
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Ensure the src directory is in the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

try:
    from src.llm_interpreter.interpreter import (
        supabase,
        fetch_assessments_for_llm,
        process_single_assessment,
        update_assessment_status,
        fetch_products_for_classification
    )
    from src.mcps import get_active_mcps, BaseMCP
except ImportError as e:
    print(f"Error importing necessary modules: {e}")
    print("Ensure the script is run from the project root or PYTHONPATH is set correctly.")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - DEMO - %(levelname)s - %(message)s')
logger = logging.getLogger("demo_script")

load_dotenv()

def print_mcp_details(mcp_name: str, mcp_version: str, mcp_output: Optional[Dict[str, Any]]):
    if not mcp_output:
        print(f"  [{mcp_name}] No output generated (likely due to error).")
        return
    confidence = mcp_output.get('confidence', 'N/A')
    db_patch = mcp_output.get('_db_patch')
    error = mcp_output.get('error')
    print(f"  [{mcp_name}] (v{mcp_version}) Confidence: {confidence}")
    if error:
        print(f"  [{mcp_name}] Error: {error}")
    # Print HS code result if present
    products_result = mcp_output.get('result', {}).get('products')
    if products_result:
        for pid, pdata in products_result.items():
            hs_code = pdata.get('suggestedHSCode')
            if hs_code:
                print(f"    - Product ID: {pid}, HS code: {hs_code}, Confidence: {pdata.get('confidence')}")
    if db_patch:
        print(f"  [{mcp_name}] DB Patch Summary:")
        for table, updates in db_patch.items():
            for record_id, patch_data in updates.items():
                print(f"    - Table: {table}, Record ID: {record_id}, Columns: {list(patch_data.keys())}")
    else:
        print(f"  [{mcp_name}] No DB Patch generated.")

def run_for_single_assessment(assessment_id: str, print_payloads: bool, apply_patch: bool):
    from src.mcps.helpers import handle_mcp_result, log_mcp_run
    import datetime
    logger.info(f"Attempting to process single assessment ID: {assessment_id}")
    if not supabase:
        logger.error("Supabase client not initialized. Cannot fetch assessment.")
        return
    try:
        response = supabase.table("Assessments").select("*").eq("id", assessment_id).single().execute()
        assessment = response.data
        if not assessment:
            logger.error(f"Assessment with ID {assessment_id} not found.")
            return
        logger.info(f"Found assessment: {assessment_id}, Status: {assessment.get('status')}")
        print(f"\n--- Processing Assessment: {assessment_id} ---")
        products = fetch_products_for_classification(assessment_id)
        print(f"Fetched {len(products)} associated products.")
        active_mcps: Dict[str, BaseMCP] = get_active_mcps(assessment)
        if not active_mcps:
            print("No active MCPs for this assessment's status.")
            print("--- Finished Assessment ---")
            return
        print(f"Active MCPs: {list(active_mcps.keys())}")
        overall_status = "success"
        mcp_errors = 0
        for mcp_name, mcp_instance in active_mcps.items():
            print(f"\n -> Running MCP: {mcp_name} (v{mcp_instance.version})")
            mcp_output = None
            try:
                payload = mcp_instance.build_payload(assessment, products)
                if print_payloads:
                    print(f"  [{mcp_name}] Payload: {payload}")
                mcp_output = mcp_instance.run(payload)
                print_mcp_details(mcp_name, mcp_instance.version, mcp_output)
                # Always log run
                log_mcp_run(
                    mcp_name=mcp_name,
                    mcp_version=mcp_instance.version,
                    payload=payload,
                    result=mcp_output.get('result'),
                    confidence=mcp_output.get('confidence'),
                    llm_input_prompt=mcp_output.get('llm_input_prompt'),
                    llm_raw_output=mcp_output.get('llm_raw_output'),
                    error=mcp_output.get('error'),
                    started_at=datetime.datetime.now(datetime.timezone.utc),
                    completed_at=datetime.datetime.now(datetime.timezone.utc),
                    assessment_id=assessment_id,
                    classification_id=assessment_id  # Use assessment_id as classification_id for now
                )
                if apply_patch and mcp_output.get('_db_patch'):
                    handle_mcp_result(mcp_output)
                if mcp_output and mcp_output.get("error"):
                    mcp_errors += 1
            except Exception as e:
                logger.error(f"Error running MCP {mcp_name}: {e}", exc_info=True)
                print(f"  [{mcp_name}] Execution failed: {e}")
                mcp_errors += 1
        if mcp_errors == len(active_mcps):
            overall_status = "failed"
        elif mcp_errors > 0:
            overall_status = "partial"
        print(f"\nOverall Status: {overall_status}")
        if apply_patch:
            print("(DB patches and logs applied)")
        else:
            print("(Simulation mode: no DB changes applied)")
        print("--- Finished Assessment ---")
    except Exception as e:
        logger.error(f"Error processing assessment {assessment_id}: {e}", exc_info=True)

def run_batch_process(apply_patch: bool):
    from src.mcps.helpers import handle_mcp_result, log_mcp_run
    import datetime
    logger.info("Starting full interpreter batch run via demo script...")
    if not supabase:
        logger.error("Supabase client not initialized. Cannot run batch.")
        return
    try:
        # Fetch all assessments where llm_ready = true
        assessments_resp = supabase.table("Assessments").select("*").eq("llm_ready", True).execute()
        assessments = assessments_resp.data or []
        logger.info(f"Found {len(assessments)} assessments with llm_ready = true.")
        for assessment in assessments:
            assessment_id = assessment.get("id")
            print(f"\n--- Processing Assessment: {assessment_id} ---")
            products = fetch_products_for_classification(assessment_id)
            active_mcps: Dict[str, BaseMCP] = get_active_mcps(assessment)
            if not active_mcps:
                print("No active MCPs for this assessment's status.")
                print("--- Finished Assessment ---")
                continue
            print(f"Active MCPs: {list(active_mcps.keys())}")
            mcp_errors = 0
            for mcp_name, mcp_instance in active_mcps.items():
                print(f"\n -> Running MCP: {mcp_name} (v{mcp_instance.version})")
                mcp_output = None
                try:
                    payload = mcp_instance.build_payload(assessment, products)
                    mcp_output = mcp_instance.run(payload)
                    print_mcp_details(mcp_name, mcp_instance.version, mcp_output)
                    # Always log run
                    log_mcp_run(
                        mcp_name=mcp_name,
                        mcp_version=mcp_instance.version,
                        payload=payload,
                        result=mcp_output.get('result'),
                        confidence=mcp_output.get('confidence'),
                        llm_input_prompt=mcp_output.get('llm_input_prompt'),
                        llm_raw_output=mcp_output.get('llm_raw_output'),
                        error=mcp_output.get('error'),
                        started_at=datetime.datetime.now(datetime.timezone.utc),
                        completed_at=datetime.datetime.now(datetime.timezone.utc),
                        assessment_id=assessment_id,
                        classification_id=assessment_id
                    )
                    if apply_patch and mcp_output.get('_db_patch'):
                        handle_mcp_result(mcp_output)
                    if mcp_output and mcp_output.get("error"):
                        mcp_errors += 1
                except Exception as e:
                    logger.error(f"Error running MCP {mcp_name}: {e}", exc_info=True)
                    print(f"  [{mcp_name}] Execution failed: {e}")
                    mcp_errors += 1
            print("--- Finished Assessment ---")
        print("\nBatch run complete.")
        if apply_patch:
            print("(DB patches and logs applied)")
        else:
            print("(Simulation mode: no DB changes applied)")
    except Exception as e:
        logger.error(f"Error during interpreter batch run: {e}", exc_info=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Demo CLI for running TradeWizard MCP Interpreter.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--assessment-id", type=str, help="UUID of a single assessment to process.")
    group.add_argument("--batch", action="store_true", help="Run the full batch processing.")
    parser.add_argument(
        "--print-payloads",
        action="store_true",
        help="Print the payload sent to each MCP (only affects --assessment-id mode)."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="If set, DB patches and logs will be applied. Otherwise, simulation mode only."
    )
    args = parser.parse_args()
    if args.assessment_id:
        run_for_single_assessment(args.assessment_id, args.print_payloads, args.apply)
    elif args.batch:
        run_batch_process(args.apply)
    else:
        parser.print_help()
