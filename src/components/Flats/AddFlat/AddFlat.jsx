import FlatForm from '../FlatForm/FlatForm';
import styles from './AddFlat.module.css';

const AddFlat = () => {
  const refreshList = async () => {
  };

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.title}>Add New Property</h1>
        <FlatForm refreshList={refreshList} />
      </div>
    </div>
  );
};

export default AddFlat;